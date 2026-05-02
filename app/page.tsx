"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, UserCheck, Database, Calendar, Plus, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NewVisitModal } from "@/components/NewVisitModal";
import { formatDate } from "@/lib/utils";

interface Analytics {
  todayCount: number;
  activeNow: number;
  totalVisitors: number;
  monthCount: number;
  visitsByDay: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  topVisitors: { visitorId: string; fullName: string; count: number }[];
}

interface ActiveVisit {
  id: string;
  passCode: string;
  purpose: string;
  checkIn: string;
  visitor: { fullName: string };
  employee: { name: string; department: string };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Активные",
  COMPLETED: "Завершённые",
  CANCELLED: "Отменённые",
};

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function update() {
      setTime(
        new Intl.DateTimeFormat("ru-RU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="text-sm text-gray-500 capitalize">{time}</p>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeVisits, setActiveVisits] = useState<ActiveVisit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [analyticsRes, visitsRes] = await Promise.all([
      fetch("/api/analytics"),
      fetch("/api/visits?status=ACTIVE&limit=50"),
    ]);
    setAnalytics(await analyticsRes.json());
    const data = await visitsRes.json();
    setActiveVisits(data.visits ?? []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCheckout(id: string) {
    setCheckingOut(id);
    try {
      const res = await fetch(`/api/visits/${id}/checkout`, { method: "PATCH" });
      if (!res.ok) throw new Error("Ошибка");
      toast.success("Выход зарегистрирован");
      await fetchData();
      router.refresh();
    } catch {
      toast.error("Не удалось зарегистрировать выход");
    } finally {
      setCheckingOut(null);
    }
  }

  const statCards = [
    { label: "Сегодня", value: analytics?.todayCount, icon: Calendar, color: "text-blue-600" },
    { label: "Сейчас в здании", value: analytics?.activeNow, icon: UserCheck, color: "text-green-600" },
    { label: "Всего в базе", value: analytics?.totalVisitors, icon: Database, color: "text-purple-600" },
    { label: "За месяц", value: analytics?.monthCount, icon: Users, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Clock />
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Новый визит
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                {value === undefined ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Посещения за 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.visitsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}.${d.getMonth() + 1}`;
                    }}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => {
                      const d = new Date(String(v));
                      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">По статусам</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                  >
                    {analytics.statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#ccc"}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => STATUS_LABELS[value] ?? value}
                    iconSize={10}
                  />
                  <Tooltip formatter={(v, name) => [v, STATUS_LABELS[String(name)] ?? name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active visits table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Активные визиты</CardTitle>
        </CardHeader>
        <CardContent>
          {!analytics ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activeVisits.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Нет активных визитов</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4 font-medium">Пропуск</th>
                    <th className="text-left py-2 pr-4 font-medium">Посетитель</th>
                    <th className="text-left py-2 pr-4 font-medium">Сотрудник</th>
                    <th className="text-left py-2 pr-4 font-medium">Цель</th>
                    <th className="text-left py-2 pr-4 font-medium">Вход</th>
                    <th className="text-left py-2 font-medium">Статус</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activeVisits.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{v.passCode}</td>
                      <td className="py-2 pr-4">{v.visitor.fullName}</td>
                      <td className="py-2 pr-4">
                        {v.employee.name}
                        <span className="text-gray-400"> / {v.employee.department}</span>
                      </td>
                      <td className="py-2 pr-4">{v.purpose}</td>
                      <td className="py-2 pr-4 text-gray-500">{formatDate(v.checkIn)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="info">Активен</Badge>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          disabled={checkingOut === v.id}
                          onClick={() => handleCheckout(v.id)}
                        >
                          <LogOut className="h-3 w-3" />
                          Выход
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewVisitModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
