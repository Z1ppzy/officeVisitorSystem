import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { publicUser, setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default("USER"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

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
    },
  });

  const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  setSessionCookie(response, user);
  return response;
}
