import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  position: z.string().min(2).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(employee);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  await prisma.employee.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
