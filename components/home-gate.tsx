"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { getLoggedInUser } from "@/lib/auth";
import type { CleaningTask } from "@/lib/tasks";

export function HomeGate({ tasks }: { tasks: CleaningTask[] }) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const nextHasSession = Boolean(getLoggedInUser());
      setHasSession(nextHasSession);

      if (nextHasSession) {
        router.replace("/today");
      }
    });
  }, [router]);

  if (hasSession !== false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-8 text-slate-600">
        Loading house...
      </main>
    );
  }

  return <LoginScreen tasks={tasks} />;
}
