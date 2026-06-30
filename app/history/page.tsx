"use client";

import { AppShell } from "@/components/app-shell";

export default function HistoryPage() {
  return (
    <AppShell eyebrow="Recently updated" title="540A cleaning history">
      <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
        <p className="text-4xl" aria-hidden="true">
          🧽
        </p>
        <h2 className="mt-3 text-xl font-black">No local history yet</h2>
        <p className="mt-2 text-slate-600">
          Complete or skip Google Calendar tasks to see them here once history
          is connected.
        </p>
      </section>
    </AppShell>
  );
}
