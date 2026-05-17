import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { forbidden, getCurrentUser, publicUser, unauthorized } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default("USER"),
  isActive: z.boolean().default(true),
});

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { response: unauthorized() };
  if (user.role !== "ADMIN") return { response: forbidden() };
  return { user };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (exists) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: hashPassword(parsed.data.password),
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
  });

  return NextResponse.json(publicUser(user), { status: 201 });
}
