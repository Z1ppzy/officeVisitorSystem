"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const visitSchema = z.object({
  visitorId: z.string().min(1, "Выберите посетителя"),
  employeeId: z.string().min(1, "Выберите сотрудника"),
  purpose: z.string().min(2, "Укажите цель визита"),
});

type Employee = { id: string; name: string; department: string };
type Visitor = { id: string; fullName: string; phone: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewVisitModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    visitorId: "",
    employeeId: "",
    purpose: "",
    newVisitor: false,
    fullName: "",
    phone: "",
    documentNumber: "",
    email: "",
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/visitors?limit=200").then((r) => r.json()),
    ]).then(([emp, vis]) => {
      setEmployees(emp.employees ?? emp);
      setVisitors(vis.visitors ?? vis);
    });
  }, [open]);

  function handleField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      let visitorId = form.visitorId;

      if (form.newVisitor) {
        const res = await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            documentNumber: form.documentNumber,
            email: form.email || undefined,
          }),
        });
        if (!res.ok) throw new Error("Не удалось создать посетителя");
        const data = await res.json();
        visitorId = data.id;
      }

      const parsed = visitSchema.safeParse({
        visitorId,
        employeeId: form.employeeId,
        purpose: form.purpose,
      });

      if (!parsed.success) {
        const errs: Record<string, string> = {};
        parsed.error.issues.forEach((i) => {
          errs[i.path[0] as string] = i.message;
        });
        setErrors(errs);
        return;
      }

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) throw new Error("Ошибка создания визита");

      toast.success("Визит зарегистрирован");
      onOpenChange(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новый визит</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newVisitor"
              checked={form.newVisitor}
              onChange={(e) => handleField("newVisitor", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="newVisitor">Новый посетитель</Label>
          </div>

          {form.newVisitor ? (
            <div className="space-y-3">
              <div>
                <Label>ФИО *</Label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={form.fullName}
                  onChange={(e) => handleField("fullName", e.target.value)}
                />
              </div>
              <div>
                <Label>Телефон *</Label>
                <Input
                  placeholder="+7 900 000 0000"
                  value={form.phone}
                  onChange={(e) => handleField("phone", e.target.value)}
                />
              </div>
              <div>
                <Label>Документ *</Label>
                <Input
                  placeholder="4510 123456"
                  value={form.documentNumber}
                  onChange={(e) => handleField("documentNumber", e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => handleField("email", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Посетитель *</Label>
              <Select value={form.visitorId} onValueChange={(v) => handleField("visitorId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите посетителя" />
                </SelectTrigger>
                <SelectContent>
                  {visitors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.fullName} — {v.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.visitorId && (
                <p className="text-xs text-red-500 mt-1">{errors.visitorId}</p>
              )}
            </div>
          )}

          <div>
            <Label>Сотрудник *</Label>
            <Select value={form.employeeId} onValueChange={(v) => handleField("employeeId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
            )}
          </div>

          <div>
            <Label>Цель визита *</Label>
            <Input
              placeholder="Деловая встреча"
              value={form.purpose}
              onChange={(e) => handleField("purpose", e.target.value)}
            />
            {errors.purpose && (
              <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Сохранение..." : "Зарегистрировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
