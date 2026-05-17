"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
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

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  _count: { visits: number };
}

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", department: "", position: "" });
  const [editDraft, setEditDraft] = useState({ name: "", department: "", position: "" });
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === "ADMIN";

  const fetchEmployees = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data.employees);
    setLoading(false);
  }, [canManage]);

  useEffect(() => {
    if (!authLoading) fetchEmployees();
  }, [authLoading, fetchEmployees]);

  if (!authLoading && !canManage) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-gray-500">
          Нет доступа к управлению сотрудниками
        </CardContent>
      </Card>
    );
  }

  async function handleAdd() {
    if (!form.name || !form.department || !form.position) {
      toast.error("Заполните все поля");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Сотрудник добавлен");
      setModalOpen(false);
      setForm({ name: "", department: "", position: "" });
      fetchEmployees();
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error();
      toast.success("Данные обновлены");
      setEditingId(null);
      fetchEmployees();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить сотрудника "${name}"?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Сотрудник удалён");
      fetchEmployees();
    } catch {
      toast.error("Ошибка удаления");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить сотрудника
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Справочник сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Сотрудников нет</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-4 font-medium">ФИО</th>
                  <th className="text-left py-2 pr-4 font-medium">Отдел</th>
                  <th className="text-left py-2 pr-4 font-medium">Должность</th>
                  <th className="text-left py-2 pr-4 font-medium">Визитов</th>
                  <th className="text-right py-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0">
                    {editingId === emp.id ? (
                      <>
                        <td className="py-1 pr-2">
                          <Input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            value={editDraft.department}
                            onChange={(e) => setEditDraft((d) => ({ ...d, department: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            value={editDraft.position}
                            onChange={(e) => setEditDraft((d) => ({ ...d, position: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1 pr-2 text-center">{emp._count.visits}</td>
                        <td className="py-1 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(emp.id)} disabled={saving}>
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4 font-medium">{emp.name}</td>
                        <td className="py-2 pr-4 text-gray-600">{emp.department}</td>
                        <td className="py-2 pr-4 text-gray-600">{emp.position}</td>
                        <td className="py-2 pr-4 text-center">{emp._count.visits}</td>
                        <td className="py-2 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(emp.id);
                              setEditDraft({ name: emp.name, department: emp.department, position: emp.position });
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(emp.id, emp.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(["name", "department", "position"] as const).map((field) => {
              const labels = { name: "ФИО *", department: "Отдел *", position: "Должность *" };
              const placeholders = {
                name: "Иванов Иван Иванович",
                department: "IT",
                position: "Разработчик",
              };
              return (
                <div key={field}>
                  <Label>{labels[field]}</Label>
                  <Input
                    placeholder={placeholders[field]}
                    value={form[field]}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  />
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
