"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { z } from "zod";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDateOnly } from "@/lib/utils";

const addSchema = z.object({
  fullName: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().min(6, "Минимум 6 символов"),
  documentNumber: z.string().min(4, "Минимум 4 символа"),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
});

interface Visitor {
  id: string;
  fullName: string;
  phone: string;
  documentNumber: string;
  email: string | null;
  _count: { visits: number };
  visits: { checkIn: string }[];
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", documentNumber: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const limit = 15;

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/visitors?${params}`);
    const data = await res.json();
    setVisitors(data.visitors);
    setTotal(data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchVisitors, page === 1 ? 0 : 0);
    return () => clearTimeout(t);
  }, [fetchVisitors]);

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void debouncedSearch;
  }, [debouncedSearch]);

  async function handleAdd() {
    const parsed = addSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, email: parsed.data.email || undefined }),
      });
      if (!res.ok) throw new Error("Ошибка");
      toast.success("Посетитель добавлен");
      setModalOpen(false);
      setForm({ fullName: "", phone: "", documentNumber: "", email: "" });
      fetchVisitors();
    } catch {
      toast.error("Не удалось добавить посетителя");
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Посетители</h1>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить посетителя
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Поиск по ФИО, телефону, документу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : visitors.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Посетители не найдены</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4 font-medium">ФИО</th>
                    <th className="text-left py-2 pr-4 font-medium">Телефон</th>
                    <th className="text-left py-2 pr-4 font-medium">Документ</th>
                    <th className="text-left py-2 pr-4 font-medium">Визитов</th>
                    <th className="text-left py-2 font-medium">Последний визит</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <Link href={`/visitors/${v.id}`} className="text-blue-700 hover:underline font-medium">
                          {v.fullName}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{v.phone}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-600">{v.documentNumber}</td>
                      <td className="py-2 pr-4 text-center">{v._count.visits}</td>
                      <td className="py-2 text-gray-500">
                        {v.visits[0] ? formatDateOnly(v.visits[0].checkIn) : "—"}
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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить посетителя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(["fullName", "phone", "documentNumber", "email"] as const).map((field) => {
              const labels: Record<string, string> = {
                fullName: "ФИО *",
                phone: "Телефон *",
                documentNumber: "Номер документа *",
                email: "Email",
              };
              const placeholders: Record<string, string> = {
                fullName: "Иванов Иван Иванович",
                phone: "+7 900 000 0000",
                documentNumber: "4510 123456",
                email: "email@example.com",
              };
              return (
                <div key={field}>
                  <Label>{labels[field]}</Label>
                  <Input
                    placeholder={placeholders[field]}
                    value={form[field]}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, [field]: e.target.value }));
                      setErrors((p) => ({ ...p, [field]: "" }));
                    }}
                  />
                  {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Сохранение..." : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
