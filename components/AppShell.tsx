"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";

const AUTH_PAGES = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (AUTH_PAGES.has(pathname)) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <AuthProvider>
      <Sidebar />
      <main className="ml-60 min-h-screen bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </AuthProvider>
  );
}
