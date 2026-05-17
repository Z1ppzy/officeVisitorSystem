import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { type User, type UserRole } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type CurrentUser = Pick<User, "id" | "name" | "email" | "role" | "isActive">;

type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
};

function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? "office-visitor-system-local-secret";
}

function sign(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: Pick<User, "id" | "name" | "email" | "role">): string {
  const payload = encodePayload({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;

  const [payloadRaw, signature] = token.split(".");
  if (!payloadRaw || !signature || !safeEqual(sign(payloadRaw), signature)) {
    return null;
  }

  const payload = decodePayload(payloadRaw);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getCurrentUser(req?: NextRequest): Promise<CurrentUser | null> {
  const token = req
    ? req.cookies.get(SESSION_COOKIE)?.value
    : cookies().get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return user?.isActive ? user : null;
}

export function publicUser(user: CurrentUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

export function setSessionCookie(
  response: NextResponse,
  user: Pick<User, "id" | "name" | "email" | "role">
) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0,
  });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireAuthenticated(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { response: unauthorized() };
  return { user };
}

export async function requireAdmin(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if ("response" in auth) return auth;
  if (auth.user.role !== "ADMIN") return { response: forbidden() };
  return auth;
}
