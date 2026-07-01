"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import type { LoggedInUser } from "@/lib/auth";
import { getLoggedInUser } from "@/lib/auth";

export function AppShell({
  children,
  title,
  eyebrow,
  requireAdmin = false,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
  requireAdmin?: boolean;
  wide?: boolean;
}) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getLoggedInUser());
      setIsReady(true);
    });
  }, []);

  const needsLogin = isReady && !user;
  const isDenied = isReady && !!user && requireAdmin && user.role !== "admin";

  return (
    <main className="min-h-screen bg-cream-50 px-4 pb-28 text-slate-950 sm:px-6 sm:pb-10">
      <AppHeader user={user} />
      <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <header className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-roof-800">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>
        </header>

        {!isReady ? (
          <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm">
            Loading house...
          </div>
        ) : needsLogin ? (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-soft">
            <p className="text-4xl" aria-hidden="true">
              👋
            </p>
            <h2 className="mt-3 text-2xl font-black">Log in to continue</h2>
            <p className="mt-2 text-slate-600">
              Choose Admin or a calendar assignee and enter the matching PIN to
              create a local session.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-full bg-roof-800 px-5 py-3 font-bold text-white"
            >
              Go to login
            </Link>
          </section>
        ) : isDenied ? (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-soft">
            <p className="text-4xl" aria-hidden="true">
              🔒
            </p>
            <h2 className="mt-3 text-2xl font-black">Admin access only</h2>
            <p className="mt-2 text-slate-600">
              Log in as Admin to manage house members from calendar tasks.
            </p>
            <Link
              href="/today"
              className="mt-5 inline-flex rounded-full bg-roof-800 px-5 py-3 font-bold text-white"
            >
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
