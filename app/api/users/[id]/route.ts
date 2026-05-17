import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { forbidden, getCurrentUser, publicUser, unauthorized } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { response: unauthorized() };
  if (user.role !== "ADMIN") return { response: forbidden() };
  return { user };
}

async function isLastActiveAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (user?.role !== "ADMIN" || !user.isActive) return false;

  const activeAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });

  return activeAdmins <= 1;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (
    (parsed.data.role === "USER" || parsed.data.isActive === false) &&
    (await isLastActiveAdmin(params.id))
  ) {
    return NextResponse.json(
      { error: "Cannot remove the last active admin" },
      { status: 400 }
    );
  }

  const { password, email, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...rest,
      email: email?.trim().toLowerCase(),
      passwordHash: password ? hashPassword(password) : undefined,
    },
  });

  return NextResponse.json(publicUser(user));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  if (await isLastActiveAdmin(params.id)) {
    return NextResponse.json(
      { error: "Cannot delete the last active admin" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
