"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Активен",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

const STATUS_VARIANTS: Record<string, "info" | "success" | "destructive"> = {
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

interface Visit {
  id: string;
  passCode: string;
  purpose: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  visitor: { fullName: string; phone: string };
  employee: { name: string; department: string };
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== "all") params.set("status", status);
    if (date) params.set("date", date);
    const res = await fetch(`/api/visits?${params}`);
    const data = await res.json();
    setVisits(data.visits);
    setTotal(data.total);
    setLoading(false);
  }, [page, status, date]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  function exportCsv() {
    const header = ["Пропуск", "Посетитель", "Телефон", "Сотрудник", "Отдел", "Цель", "Вход", "Выход", "Статус"];
    const rows = visits.map((v) => [
      v.passCode,
      v.visitor.fullName,
      v.visitor.phone,
      v.employee.name,
      v.employee.department,
      v.purpose,
      formatDate(v.checkIn),
      formatDate(v.checkOut),
      STATUS_LABELS[v.status] ?? v.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV экспортирован");
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Журнал визитов</h1>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3 flex-wrap">
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-44"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="ACTIVE">Активные</SelectItem>
                <SelectItem value="COMPLETED">Завершённые</SelectItem>
                <SelectItem value="CANCELLED">Отменённые</SelectItem>
              </SelectContent>
            </Select>
            {(date || (status && status !== "all")) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDate(""); setStatus("all"); setPage(1); }}
              >
                Сбросить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : visits.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Визиты не найдены</p>
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
                    <th className="text-left py-2 pr-4 font-medium">Выход</th>
                    <th className="text-left py-2 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs">{v.passCode}</td>
                      <td className="py-2 pr-4">
                        <div>{v.visitor.fullName}</div>
                        <div className="text-xs text-gray-400">{v.visitor.phone}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div>{v.employee.name}</div>
                        <div className="text-xs text-gray-400">{v.employee.department}</div>
                      </td>
                      <td className="py-2 pr-4">{v.purpose}</td>
                      <td className="py-2 pr-4 text-gray-500">{formatDate(v.checkIn)}</td>
                      <td className="py-2 pr-4 text-gray-500">{formatDate(v.checkOut)}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_VARIANTS[v.status] ?? "outline"}>
                          {STATUS_LABELS[v.status] ?? v.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
