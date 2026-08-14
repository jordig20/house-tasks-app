"use client";

import { useState, type FormEvent } from "react";
import { getLoggedInUser, getUserRequestHeaders } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
import {
  buildPrintableCalendar,
  getMonthStartKey,
  shiftMonth,
} from "@/lib/printable-calendar";
import { buildPrintableCalendarPdf } from "@/lib/printable-calendar-pdf";
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
const eventDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const eventTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Edmonton",
});

function formatMonth(monthStart: string) {
  return monthFormatter.format(new Date(`${monthStart}T12:00:00.000Z`));
}

function formatDate(dateKey: string) {
  return fullDateFormatter.format(new Date(`${dateKey}T12:00:00.000Z`));
}

function formatEventDate(rawStart: string, isAllDay: boolean) {
  if (isAllDay || /^\d{4}-\d{2}-\d{2}$/.test(rawStart)) {
    return eventDayFormatter.format(new Date(`${rawStart.slice(0, 10)}T12:00:00.000Z`));
  }

  const startDate = new Date(rawStart);
  const day = eventDayFormatter.format(new Date(`${formatEventDateKey(startDate)}T12:00:00.000Z`));
  return `${day} · ${eventTimeFormatter.format(startDate)}`;
}

function formatEventEndDate(rawEnd: string, isAllDay: boolean) {
  if (isAllDay || /^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) {
    return eventDayFormatter.format(new Date(`${rawEnd.slice(0, 10)}T12:00:00.000Z`));
  }

  return eventDayFormatter.format(new Date(`${formatEventDateKey(new Date(rawEnd))}T12:00:00.000Z`));
}

function formatEventDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
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
  const days = buildPrintableCalendar(monthStart, tasks);
  const weekCount = days.length / 7;
  const weeks = Array.from({ length: weekCount }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );
  const taskList = Array.from(
    new Map(tasks.map((task) => [task.id, task])).values(),
  ).sort(
    (first, second) =>
      first.start.localeCompare(second.start) ||
      first.title.localeCompare(second.title) ||
      first.id.localeCompare(second.id),
  );
  const usersById = new Map(users.map((user) => [user.id, user]));

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

  function downloadPdf() {
    if (!hasLoaded) {
      return;
    }

    const doc = buildPrintableCalendarPdf({
      monthLabel: formatMonth(monthStart),
      monthStart,
      days,
      users,
    });
    doc.save(`540a-calendar-${monthStart}.pdf`);
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
              className="min-h-11 rounded-full border border-slate-200 bg-white px-5 py-3 font-ui text-sm font-black text-slate-700 disabled:opacity-50"
              disabled={!hasLoaded || isLoading}
              type="button"
              onClick={() => window.print()}
            >
              Print preview
            </button>
            <button
              className="action-primary min-h-11 rounded-full px-5 py-3 font-ui text-sm font-black disabled:opacity-50"
              disabled={!hasLoaded || isLoading}
              type="button"
              onClick={downloadPdf}
            >
              Download PDF
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

      <section
        aria-label={`${formatMonth(monthStart)} printable household calendar`}
        className={`print-calendar-sheet overflow-x-auto bg-white text-slate-950 shadow-[0_12px_36px_rgba(15,23,42,0.1)] ring-1 ring-slate-200 ${hasLoaded && tasks.length === 0 ? "has-empty-calendar" : ""}`}
      >
        <header className="print-calendar-title flex items-end justify-between gap-4 border-b-2 border-slate-950 px-5 py-4">
          <div>
            <p className="font-ui text-[0.65rem] font-black uppercase tracking-[0.18em] text-cyan-800">
              540A Cleaning · Household calendar
            </p>
            <h2 id="print-calendar-heading" className="mt-1 font-display text-3xl font-bold tracking-tight">
              {formatMonth(monthStart)}
            </h2>
          </div>
          <p className={`max-w-56 text-right font-ui text-xs font-bold ${warnings.length > 0 ? "text-amber-800" : "text-slate-500"}`}>
            {warnings.length > 0
              ? "Calendar warning: this month may be incomplete"
              : hasLoaded && tasks.length === 0
                ? "No tasks scheduled this month"
                : "Household schedule"}
          </p>
        </header>

        {!hasLoaded ? (
          <div className="print-hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-600">
            Enter the admin PIN and load this month to preview its tasks.
          </div>
        ) : null}

        <div
          aria-labelledby="print-calendar-heading"
          className="print-calendar-grid min-w-[58rem]"
          role="grid"
          style={{ "--calendar-weeks": weekCount } as React.CSSProperties}
        >
          <div className="calendar-row grid grid-cols-7" role="row">
            {weekdayLabels.map((weekday, index) => (
              <div
                id={`print-calendar-weekday-${index}`}
                key={weekday}
                className="calendar-weekday border-b border-r border-slate-300 bg-slate-950 px-2 py-2 text-center font-ui text-[0.65rem] font-black uppercase tracking-wide text-white"
                role="columnheader"
              >
                {weekday}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div className="calendar-row grid grid-cols-7" key={week[0].dateKey} role="row">
              {week.map((day, weekdayIndex) => (
                <div
                  aria-labelledby={`print-calendar-weekday-${weekdayIndex} print-calendar-date-${day.dateKey}`}
                  key={day.dateKey}
                  className={`calendar-day min-h-32 overflow-hidden border-b border-r border-slate-300 p-2 ${day.isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`}
                  role="gridcell"
                >
                  <time
                    aria-label={formatDate(day.dateKey)}
                    className="block font-display text-base font-bold"
                    dateTime={day.dateKey}
                    id={`print-calendar-date-${day.dateKey}`}
                  >
                    {day.dayNumber}
                  </time>
                  <div className="mt-1 space-y-1">
                    {day.tasks.map((task) => (
                      <div
                        key={`${day.dateKey}-${task.id}`}
                        className="calendar-task rounded-md bg-slate-50 px-1.5 py-1 ring-1 ring-slate-200"
                        title={`${task.title} · ${task.assignedTo.join(" & ") || "Unassigned"}`}
                      >
                        <p className="truncate font-ui text-[0.68rem] font-black leading-tight text-slate-950">
                          {task.title}
                        </p>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden">
                          {task.assignedUserIds.length > 0 ? task.assignedUserIds.map((userId, index) => {
                            const user = usersById.get(userId);
                            const name = user?.name ?? task.assignedTo[index] ?? "Assigned";

                            return (
                              <span key={userId} className="inline-flex min-w-0 items-center gap-1 font-ui text-[0.55rem] font-black leading-none text-slate-700">
                                <span
                                  aria-hidden="true"
                                  className={`h-2 w-2 shrink-0 rounded-full ring-1 ${getUserColorClass(user?.color, user?.role)}`}
                                />
                                <span className="truncate">{name}</span>
                              </span>
                            );
                          }) : (
                            <span className="font-ui text-[0.55rem] font-bold text-slate-500">Unassigned</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {hasLoaded ? (
          <section
            aria-label="Every event this month"
            className="print-calendar-detail border-t-2 border-slate-950 bg-white px-5 py-4"
          >
            <h3 className="font-display text-lg font-bold text-slate-950">
              Every event this month ({taskList.length})
            </h3>
            {taskList.length === 0 ? (
              <p className="mt-2 font-ui text-sm font-bold text-slate-600">
                No Google Calendar tasks are scheduled for this month.
              </p>
            ) : (
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {taskList.map((task) => {
                  const start = formatEventDate(task.start, task.isAllDay);
                  const end = formatEventEndDate(task.end, task.isAllDay);
                  const assignees = task.assignedUserIds.length > 0
                    ? task.assignedUserIds.map((userId, index) => {
                        const user = usersById.get(userId);
                        return user?.name ?? task.assignedTo[index] ?? "Assigned";
                      })
                    : ["Unassigned"];

                  return (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {task.assignedUserIds.length > 0 ? task.assignedUserIds.map((userId) => {
                          const user = usersById.get(userId);
                          return (
                            <span
                              key={userId}
                              aria-hidden="true"
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ring-1 ${getUserColorClass(user?.color, user?.role)}`}
                            />
                          );
                        }) : (
                          <span
                            aria-hidden="true"
                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400 ring-1 ring-slate-300"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-ui text-sm font-black text-slate-950">
                          {task.title}
                        </p>
                        <p className="font-ui text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">
                          {start}
                          {start === end ? "" : ` → ${end}`} · {assignees.join(" & ")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ) : null}
      </section>
    </div>
  );
}
