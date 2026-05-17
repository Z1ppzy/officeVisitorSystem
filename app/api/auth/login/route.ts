import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publicUser, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ user: publicUser(user) });
  setSessionCookie(response, user);
  return response;
}
