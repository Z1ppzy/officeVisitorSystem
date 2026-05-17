"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCircle,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/visitors", label: "Посетители", icon: Users },
  { href: "/visits", label: "Визиты", icon: CalendarCheck },
  { href: "/employees", label: "Сотрудники", icon: UserCog, adminOnly: true },
  { href: "/users", label: "Пользователи", icon: UsersRound, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "ADMIN");

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-[#1e3a5f] text-white z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <Building2 className="h-7 w-7 text-blue-300 shrink-0" />
        <span className="text-sm font-semibold leading-tight">Система регистрации посетителей</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-start gap-3 rounded-md bg-white/10 px-3 py-3">
          <UserCircle className="h-5 w-5 text-blue-200 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {loading ? "Загрузка..." : user?.name}
            </p>
            <p className="truncate text-xs text-blue-200">{user?.email}</p>
            {user?.role === "ADMIN" && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-100">
                <ShieldCheck className="h-3 w-3" />
                Админ
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Выйти
        </button>
        <p className="px-3 text-xs text-blue-300/70">v1.1.0</p>
      </div>
    </aside>
  );
}
