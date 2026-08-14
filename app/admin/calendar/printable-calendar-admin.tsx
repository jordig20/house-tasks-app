"use client";

import { useRef, useState, type FormEvent } from "react";
import { useReactToPrint } from "react-to-print";
import { getLoggedInUser, getUserRequestHeaders } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
import {
  buildPrintableCalendar,
  getMonthStartKey,
  shiftMonth,
} from "@/lib/printable-calendar";
import type { CleaningTask, HouseUser } from "@/lib/tasks";
import { getUserColorClass } from "@/lib/users";

type PrintableUser = Pick<HouseUser, "id" | "name" | "role" | "color">;

type CalendarResponse = {
  tasks?: CleaningTask[];
  users?: PrintableUser[];
  warnings?: string[];
  isConfiguredFallback?: boolean;
  message?: string;
};

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatMonth(monthStart: string) {
  return monthFormatter.format(new Date(`${monthStart}T12:00:00.000Z`));
}

function formatDate(dateKey: string) {
  return fullDateFormatter.format(new Date(`${dateKey}T12:00:00.000Z`));
}

function findAssigneeLabel(
  task: CleaningTask,
  usersById: Map<string, PrintableUser>,
): string {
  if (task.assignedUserIds.length === 0) {
    return "Unassigned";
  }

  return task.assignedUserIds
    .map((userId, index) => usersById.get(userId)?.name ?? task.assignedTo[index] ?? "Assigned")
    .join(" & ");
}

export function PrintableCalendarAdmin() {
  const currentMonth = getMonthStartKey(getBanffDateKey());
  const [monthStart, setMonthStart] = useState(currentMonth);
  const [actorPin, setActorPin] = useState("");
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<PrintableUser[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);
  const days = buildPrintableCalendar(monthStart, tasks);
  const weekCount = days.length / 7;
  const weeks = Array.from({ length: weekCount }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );
  const usersById = new Map(users.map((user) => [user.id, user]));

  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `540a-calendar-${monthStart}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 6mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: rgb(255, 255, 255) !important;
        }
      }
    `,
  });

  async function loadMonth(nextMonth = monthStart) {
    const currentUser = getLoggedInUser();

    if (actorPin.length !== 4) {
      setError("Enter your 4-digit admin PIN to load the calendar.");
      return;
    }

    setIsLoading(true);
    setHasLoaded(false);
    setError("");
    setWarnings([]);

    try {
      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getUserRequestHeaders(currentUser),
        },
        body: JSON.stringify({ actorPin, monthStart: nextMonth }),
      });
      const result = (await response.json()) as CalendarResponse;

      if (!response.ok || !result.tasks || !result.users) {
        throw new Error(result.message ?? "Printable calendar could not be loaded.");
      }

      setTasks(result.tasks);
      setUsers(result.users);
      setWarnings(result.warnings ?? []);
      setHasLoaded(true);
    } catch (loadError) {
      setTasks([]);
      setUsers([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Printable calendar could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadMonth();
  }

  function selectMonth(nextMonth: string) {
    setMonthStart(nextMonth);
    if (hasLoaded) {
      void loadMonth(nextMonth);
    } else {
      setTasks([]);
    }
  }

  return (
    <div className="print-page space-y-5">
      <section className="surface-card print-hidden p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Prepare a calendar for the house
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Choose a month, load the current Google Calendar tasks, then print the styled preview or download an A4 landscape PDF with each assignee&apos;s color.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="action-primary min-h-11 rounded-full px-5 py-3 font-ui text-sm font-black disabled:opacity-50"
              disabled={!hasLoaded || isLoading}
              type="button"
              onClick={() => handlePrint()}
            >
              Print A4 calendar
            </button>
          </div>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-[auto_minmax(11rem,1fr)_minmax(11rem,1fr)_auto]" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <button
              aria-label="Previous month"
              className="min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white px-3 font-ui font-black text-slate-700"
              disabled={isLoading}
              type="button"
              onClick={() => selectMonth(shiftMonth(monthStart, -1))}
            >
              ←
            </button>
            <button
              aria-label="Next month"
              className="min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white px-3 font-ui font-black text-slate-700"
              disabled={isLoading}
              type="button"
              onClick={() => selectMonth(shiftMonth(monthStart, 1))}
            >
              →
            </button>
          </div>
          <label className="grid gap-1 font-ui text-xs font-black text-slate-600">
            Month
            <input
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950"
              disabled={isLoading}
              type="month"
              value={monthStart.slice(0, 7)}
              onChange={(event) => selectMonth(`${event.target.value}-01`)}
            />
          </label>
          <label className="grid gap-1 font-ui text-xs font-black text-slate-600">
            Admin PIN
            <input
              autoComplete="current-password"
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm tracking-[0.3em] text-slate-950"
              inputMode="numeric"
              maxLength={4}
              type="password"
              value={actorPin}
              onChange={(event) => setActorPin(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <button
            className="min-h-11 self-end rounded-full bg-cyan-700 px-5 py-3 font-ui text-sm font-black text-white disabled:opacity-50"
            disabled={actorPin.length !== 4 || isLoading}
            type="submit"
          >
            {isLoading ? "Loading..." : hasLoaded ? "Reload month" : "Load month"}
          </button>
        </form>

        {error ? (
          <p className="status-message mt-4 border border-red-200 bg-red-50 p-3 text-red-800" role="alert">
            {error} Review the month and PIN, then try again.
          </p>
        ) : null}
        {isLoading ? (
          <p className="status-message mt-4 bg-slate-50 p-3 text-slate-700" role="status" aria-live="polite">
            Loading {formatMonth(monthStart)} from Google Calendar...
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <p className="status-message mt-4 border border-amber-200 bg-amber-50 p-3 text-amber-900" role="status">
            {warnings.join(" ")} The calendar may be incomplete.
          </p>
        ) : null}
      </section>

      <div
        ref={printableRef}
        aria-label={`${formatMonth(monthStart)} printable household calendar`}
        className={`print-calendar-sheet printable-pdf bg-white text-slate-950 shadow-[0_12px_36px_rgba(15,23,42,0.1)] ring-1 ring-slate-200 ${hasLoaded && tasks.length === 0 ? "has-empty-calendar" : ""}`}
      >
        <header className="print-calendar-title">
          <div className="pdf-eyebrow">
            540A Cleaning · Household calendar
          </div>
          <div className="pdf-title-row">
            <h2 id="print-calendar-heading" className="pdf-title">
              {formatMonth(monthStart)}
            </h2>
            <p className={`pdf-subtitle ${warnings.length > 0 ? "pdf-subtitle-warn" : "pdf-subtitle-muted"}`}>
              {warnings.length > 0
                ? "Calendar warning: this month may be incomplete"
                : hasLoaded && tasks.length === 0
                  ? "No tasks scheduled this month"
                  : "Household schedule"}
            </p>
          </div>
        </header>

        {!hasLoaded ? (
          <div className="print-hidden pdf-hint">
            Enter the admin PIN and load this month to preview its tasks.
          </div>
        ) : null}

        <table
          aria-labelledby="print-calendar-heading"
          className="pdf-grid"
          role="grid"
        >
          <colgroup>
            {weekdayLabels.map((weekday) => (
              <col key={weekday} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {weekdayLabels.map((weekday, index) => (
                <th
                  id={`print-calendar-weekday-${index}`}
                  key={weekday}
                  scope="col"
                  className="pdf-weekday"
                >
                  {weekday.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0].dateKey} className="pdf-row">
                {week.map((day, weekdayIndex) => (
                  <td
                    aria-labelledby={`print-calendar-weekday-${weekdayIndex} print-calendar-date-${day.dateKey}`}
                    key={day.dateKey}
                    className={`pdf-day ${day.isCurrentMonth ? "pdf-day-current" : "pdf-day-adjacent"}`}
                    role="gridcell"
                  >
                    <time
                      aria-label={formatDate(day.dateKey)}
                      className={`pdf-day-number ${day.isCurrentMonth ? "pdf-day-number-current" : "pdf-day-number-adjacent"}`}
                      dateTime={day.dateKey}
                      id={`print-calendar-date-${day.dateKey}`}
                    >
                      {day.dayNumber}
                    </time>
                    <div className="pdf-task-list">
                      {day.tasks.map((task) => (
                        <div
                          key={`${day.dateKey}-${task.id}`}
                          className="pdf-task"
                          title={`${task.title} · ${findAssigneeLabel(task, usersById)}`}
                        >
                          <p className="pdf-task-title">
                            {task.title}
                          </p>
                          <div className="pdf-task-meta">
                            {task.assignedUserIds.length > 0 ? task.assignedUserIds.map((userId, index) => {
                              const user = usersById.get(userId);
                              return (
                                <span
                                  key={userId}
                                  className={`pdf-assignee ${user ? getUserColorClass(user.color, user.role) : "pdf-assignee-fallback"}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`pdf-swatch ${user ? getUserColorClass(user.color, user.role) : "pdf-swatch-fallback"}`}
                                  />
                                  <span className="pdf-assignee-name">
                                    {user?.name ?? task.assignedTo[index] ?? "Assigned"}
                                  </span>
                                </span>
                              );
                            }) : (
                              <span className="pdf-assignee-fallback">
                                <span aria-hidden="true" className="pdf-swatch-fallback pdf-swatch" />
                                <span className="pdf-assignee-name">Unassigned</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {hasLoaded && tasks.length === 0 ? (
          <p className="pdf-empty">
            No Google Calendar tasks are scheduled for this month.
          </p>
        ) : null}
      </div>
    </div>
  );
}
