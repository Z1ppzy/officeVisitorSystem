"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateOnly } from "@/lib/utils";

type Role = "ADMIN" | "USER";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as Role,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.status === 403) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [fetchUsers, user?.role]);

  async function handleCreate() {
    if (!form.name || !form.email || form.password.length < 6) {
      toast.error("Заполните имя, email и пароль от 6 символов");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error(res.status === 409 ? "Email уже занят" : "Не удалось создать аккаунт");
      }

      toast.success("Пользователь добавлен");
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "USER" });
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  }

  async function updateUser(id: string, data: Partial<Pick<UserRow, "role" | "isActive">>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Не удалось обновить пользователя");
      toast.success("Пользователь обновлён");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(row: UserRow) {
    if (!confirm(`Удалить пользователя "${row.name}"?`)) return;

    setSavingId(row.id);
    try {
      const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить пользователя");
      toast.success("Пользователь удалён");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-gray-500">
          Нет доступа к управлению пользователями
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Аккаунты и роли</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-4 font-medium">Имя</th>
                    <th className="text-left py-2 pr-4 font-medium">Email</th>
                    <th className="text-left py-2 pr-4 font-medium">Роль</th>
                    <th className="text-left py-2 pr-4 font-medium">Статус</th>
                    <th className="text-left py-2 pr-4 font-medium">Создан</th>
                    <th className="text-right py-2 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        <span>{row.name}</span>
                        {row.id === user.id && (
                          <Badge variant="outline" className="ml-2">
                            Вы
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{row.email}</td>
                      <td className="py-2 pr-4">
                        <Select
                          value={row.role}
                          disabled={savingId === row.id}
                          onValueChange={(role: Role) => updateUser(row.id, { role })}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Пользователь</SelectItem>
                            <SelectItem value="ADMIN">Админ</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === row.id}
                          onClick={() => updateUser(row.id, { isActive: !row.isActive })}
                        >
                          {row.isActive ? "Активен" : "Отключён"}
                        </Button>
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {formatDateOnly(row.createdAt)}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          disabled={savingId === row.id || row.id === user.id}
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-3 w-3" />
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Имя *</Label>
              <Input
                placeholder="Иван Иванов"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="user@office.local"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Роль</Label>
              <Select
                value={form.role}
                onValueChange={(role: Role) => setForm((prev) => ({ ...prev, role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Пользователь</SelectItem>
                  <SelectItem value="ADMIN">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Пароль *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
