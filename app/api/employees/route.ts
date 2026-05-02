import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  position: z.string().min(2),
});

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { visits: true } } },
  });
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const employee = await prisma.employee.create({ data: parsed.data });
  return NextResponse.json(employee, { status: 201 });
}
