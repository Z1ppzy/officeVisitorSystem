import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  position: z.string().min(2),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if ("response" in auth) return auth.response;

  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { visits: true } } },
  });
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const employee = await prisma.employee.create({ data: parsed.data });
  return NextResponse.json(employee, { status: 201 });
}
