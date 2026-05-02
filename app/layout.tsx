import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Система регистрации посетителей",
  description: "Корпоративная система учёта посетителей",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Sidebar />
        <main className="ml-60 min-h-screen bg-gray-50">
          <div className="p-8">{children}</div>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
