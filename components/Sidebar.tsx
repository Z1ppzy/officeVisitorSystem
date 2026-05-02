"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarCheck, UserCog, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/visitors", label: "Посетители", icon: Users },
  { href: "/visits", label: "Визиты", icon: CalendarCheck },
  { href: "/employees", label: "Сотрудники", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-[#1e3a5f] text-white z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <Building2 className="h-7 w-7 text-blue-300 shrink-0" />
        <span className="text-sm font-semibold leading-tight">Система регистрации посетителей</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
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

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-blue-300/70">v1.0.0</p>
      </div>
    </aside>
  );
}
