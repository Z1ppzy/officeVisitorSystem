import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().nullable().optional(),
  documentNumber: z.string().min(4).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthenticated(req);
  if ("response" in auth) return auth.response;

  const visitor = await prisma.visitor.findUnique({
    where: { id: params.id },
    include: {
      visits: {
        orderBy: { checkIn: "desc" },
        include: { employee: true },
      },
    },
  });

  if (!visitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(visitor);
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
  const visitor = await prisma.visitor.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(visitor);
}
