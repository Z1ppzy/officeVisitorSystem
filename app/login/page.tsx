"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(res.status === 401 ? "Неверный email или пароль" : "Ошибка входа");
      }

      toast.success("Вход выполнен");
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка входа");
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
              <CardTitle className="text-xl">Вход в систему</CardTitle>
              <p className="text-sm text-gray-500">Учёт посетителей офиса</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@office.local"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-gray-500">Нет аккаунта?</span>
            <Link href="/register" className="font-medium text-blue-700 hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
