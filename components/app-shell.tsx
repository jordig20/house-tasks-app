"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import type { HouseUser } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";

export function AppShell({
  children,
  title,
  eyebrow,
  requireAdmin = false,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
  requireAdmin?: boolean;
}) {
  const [user, setUser] = useState<HouseUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedUser = window.localStorage.getItem(storageKeys.currentUser);
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setIsReady(true);
  }, []);

  const isDenied = isReady && requireAdmin && user?.role !== "admin";

  return (
    <main className="min-h-screen bg-sage-50 px-4 pb-28 text-slate-950 sm:px-6 sm:pb-10">
      <AppHeader user={user} />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sage-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </header>

        {!isReady ? (
          <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">Loading house...</div>
        ) : isDenied ? (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-soft">
            <p className="text-4xl" aria-hidden="true">🔒</p>
            <h2 className="mt-3 text-2xl font-black">Admin access only</h2>
            <p className="mt-2 text-slate-600">Log in as Jordi to manage mock house members.</p>
            <Link href="/today" className="mt-5 inline-flex rounded-full bg-sage-700 px-5 py-3 font-bold text-white">
              Back to tasks
            </Link>
          </section>
        ) : (
          children
        )}
      </div>
      <BottomNav />
    </main>
  );
}
