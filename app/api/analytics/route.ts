import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayCount, activeNow, totalVisitors, monthCount, statusRaw, allVisits, topVisitorsRaw] =
    await Promise.all([
      prisma.visit.count({ where: { checkIn: { gte: todayStart } } }),
      prisma.visit.count({ where: { status: "ACTIVE" } }),
      prisma.visitor.count(),
      prisma.visit.count({ where: { checkIn: { gte: monthStart } } }),
      prisma.visit.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.visit.findMany({
        where: { checkIn: { gte: thirtyDaysAgo } },
        select: { checkIn: true },
        orderBy: { checkIn: "asc" },
      }),
      prisma.visit.groupBy({
        by: ["visitorId"],
        _count: { visitorId: true },
        orderBy: { _count: { visitorId: "desc" } },
        take: 5,
      }),
    ]);

  // Build visits-by-day array for last 30 days
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(key, 0);
  }
  for (const v of allVisits) {
    const d = new Date(v.checkIn);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const visitsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  // Top visitors
  const visitorIds = topVisitorsRaw.map((r) => r.visitorId);
  const visitorDetails = await prisma.visitor.findMany({
    where: { id: { in: visitorIds } },
    select: { id: true, fullName: true },
  });
  const topVisitors = topVisitorsRaw.map((r) => ({
    visitorId: r.visitorId,
    count: r._count.visitorId,
    fullName: visitorDetails.find((v) => v.id === r.visitorId)?.fullName ?? "Unknown",
  }));

  const statusBreakdown = statusRaw.map((r) => ({
    status: r.status,
    count: r._count.status,
  }));

  return NextResponse.json({
    todayCount,
    activeNow,
    totalVisitors,
    monthCount,
    visitsByDay,
    topVisitors,
    statusBreakdown,
  });
}
