"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  employee: { name: string; department: string };
}

interface Visitor {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  documentNumber: string;
  createdAt: string;
  visits: Visit[];
}

export default function VisitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ fullName: "", phone: "", email: "", documentNumber: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/visitors/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setVisitor(data);
        setDraft({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email ?? "",
          documentNumber: data.documentNumber,
        });
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, email: draft.email || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setVisitor((v) => (v ? { ...v, ...updated } : v));
      setEditing(false);
      toast.success("Данные обновлены");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (!visitor) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const fields = [
    { key: "fullName", label: "ФИО" },
    { key: "phone", label: "Телефон" },
    { key: "documentNumber", label: "Документ" },
    { key: "email", label: "Email" },
  ] as const;
  const canEdit = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{visitor.fullName}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Данные посетителя</CardTitle>
          {!canEdit ? null : !editing ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(true)}>
              <Pencil className="h-3 w-3" />
              Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-3 w-3 mr-1" />
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="h-3 w-3 mr-1" />
                Сохранить
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <dt className="text-xs text-gray-500 mb-1">{label}</dt>
                {editing ? (
                  <Input
                    value={draft[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  />
                ) : (
                  <dd className="text-sm font-medium">{visitor[key] ?? "—"}</dd>
                )}
              </div>
            ))}
            <div>
              <dt className="text-xs text-gray-500 mb-1">Дата регистрации</dt>
              <dd className="text-sm font-medium">{formatDate(visitor.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 mb-1">Всего визитов</dt>
              <dd className="text-sm font-medium">{visitor.visits.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">История визитов</CardTitle>
        </CardHeader>
        <CardContent>
          {visitor.visits.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Визитов нет</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-4 font-medium">Пропуск</th>
                  <th className="text-left py-2 pr-4 font-medium">Дата входа</th>
                  <th className="text-left py-2 pr-4 font-medium">Дата выхода</th>
                  <th className="text-left py-2 pr-4 font-medium">Цель</th>
                  <th className="text-left py-2 pr-4 font-medium">Сотрудник</th>
                  <th className="text-left py-2 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {visitor.visits.map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{v.passCode}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatDate(v.checkIn)}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatDate(v.checkOut)}</td>
                    <td className="py-2 pr-4">{v.purpose}</td>
                    <td className="py-2 pr-4">
                      {v.employee.name}
                      <span className="text-gray-400"> / {v.employee.department}</span>
                    </td>
                    <td className="py-2">
                      <Badge variant={STATUS_VARIANTS[v.status] ?? "outline"}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
