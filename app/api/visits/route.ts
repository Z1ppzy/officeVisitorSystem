import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  visitorId: z.string().uuid(),
  employeeId: z.string().uuid(),
  purpose: z.string().min(2),
});

async function generatePassCode(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await prisma.visit.findFirst({
    where: { passCode: { startsWith: `VIS-${year}-` } },
    orderBy: { createdAt: "desc" },
  });

  let seq = 1;
  if (last) {
    const parts = last.passCode.split("-");
    seq = Number(parts[parts.length - 1]) + 1;
  }

  return `VIS-${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && ["ACTIVE", "COMPLETED", "CANCELLED"].includes(status)) {
    where.status = status;
  }
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.checkIn = { gte: start, lt: end };
  }

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { checkIn: "desc" },
      include: { visitor: true, employee: true },
    }),
    prisma.visit.count({ where }),
  ]);

  return NextResponse.json({ visits, total, page, limit });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const passCode = await generatePassCode();

  const visit = await prisma.visit.create({
    data: { ...parsed.data, passCode },
    include: { visitor: true, employee: true },
  });

  return NextResponse.json(visit, { status: 201 });
}
