"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncResponse = {
  synced?: number;
  message?: string;
  warnings?: string[];
};

export function CalendarSyncCard() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");

  async function syncCalendar() {
    setIsSyncing(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/sync-calendar", {
        method: "POST",
      });
      const result = (await response.json()) as SyncResponse;

      if (!response.ok) {
        throw new Error(result.message ?? "Calendar sync failed.");
      }

      setMessage(
        `Synced ${result.synced ?? 0} calendar ${result.synced === 1 ? "task" : "tasks"}.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Calendar sync failed.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="mb-5 rounded-[2rem] bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.22)] ring-1 ring-white/10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
        Calendar sync
      </p>
      <h2 className="mt-2 text-xl font-black">Refresh tasks from Google Calendar</h2>
      <p className="mt-2 text-sm font-bold text-slate-300">
        Use this after changing the monthly schedule in Google Calendar.
      </p>
      <button
        className="mt-4 rounded-full bg-cyan-300 px-5 py-3 font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        disabled={isSyncing}
        onClick={syncCalendar}
        type="button"
      >
        {isSyncing ? "Syncing..." : "Sync calendar"}
      </button>
      {message ? (
        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm font-bold text-white">
          {message}
        </p>
      ) : null}
    </section>
  );
}
