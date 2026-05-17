"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      if (!res.ok) {
        throw new Error(res.status === 409 ? "Пользователь уже существует" : "Ошибка регистрации");
      }

      toast.success("Аккаунт создан");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#1e3a5f] text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Регистрация</CardTitle>
              <p className="text-sm text-gray-500">Создание аккаунта с ролью</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Иван Иванов"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@office.local"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Роль</Label>
              <Select
                value={form.role}
                onValueChange={(role) => setForm((prev) => ({ ...prev, role }))}
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
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Повтор пароля</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <UserPlus className="h-4 w-4" />
              {loading ? "Создание..." : "Создать аккаунт"}
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-gray-500">Уже есть аккаунт?</span>
            <Link href="/login" className="font-medium text-blue-700 hover:underline">
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
