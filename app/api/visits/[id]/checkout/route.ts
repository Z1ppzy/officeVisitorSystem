import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const visit = await prisma.visit.findUnique({ where: { id: params.id } });
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (visit.status !== "ACTIVE") {
    return NextResponse.json({ error: "Visit is not active" }, { status: 400 });
  }

  const updated = await prisma.visit.update({
    where: { id: params.id },
    data: { checkOut: new Date(), status: "COMPLETED" },
    include: { visitor: true, employee: true },
  });

  return NextResponse.json(updated);
}
