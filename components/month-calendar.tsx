"use client";

import { useEffect, useMemo, useState } from "react";
import { getLoggedInUser, type LoggedInUser } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
import {
  getLocalDateKey,
  type CleaningTask,
  type TaskStatus,
} from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-950 ring-amber-200",
  done: "bg-olive-100 text-olive-700 ring-olive-600/20 line-through",
  skipped: "bg-slate-100 text-slate-500 ring-slate-200",
};
const pastStatusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-50 text-amber-800/70 ring-amber-200/70",
  done: "bg-olive-50 text-olive-700/70 ring-olive-600/10 line-through",
  skipped: "bg-slate-100 text-slate-500/70 ring-slate-200",
};
const nextStatuses: Record<TaskStatus, TaskStatus> = {
  pending: "done",
  done: "skipped",
  skipped: "pending",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "pending",
  done: "done",
  skipped: "skipped",
};

function getDateKey(date: Date) {
  return getLocalDateKey(date);
}

function parseTaskDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

function getTaskDisplayEnd(task: CleaningTask) {
  const end = parseTaskDate(task.end);

  if (task.isAllDay) {
    end.setDate(end.getDate() - 1);
  }

  return end;
}

function getCalendarDays(monthStart: string) {
  const firstDay = parseTaskDate(monthStart);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());

  const monthEnd = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 1);
  const end = new Date(monthEnd);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));

  const days: Date[] = [];
  const current = new Date(start);

  while (current < end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function taskTouchesDay(task: CleaningTask, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const taskStart = parseTaskDate(task.start);
  const taskEnd = getTaskDisplayEnd(task);
  taskEnd.setHours(23, 59, 59, 999);

  return taskStart < dayEnd && taskEnd >= dayStart;
}

function getTaskMonthLabel(task: CleaningTask) {
  const assignees =
    task.assignedTo.length > 0 ? task.assignedTo.join(" & ") : "Unassigned";

  return `${assignees} - ${task.title}`;
}

function getAssigneeInitials(task: CleaningTask) {
  if (task.assignedTo.length === 0) {
    return "Un";
  }

  return task.assignedTo
    .map((person) => person.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("&");
}

function getTaskKindIcon(task: CleaningTask) {
  if (task.taskKind === "trash") {
    return "♻";
  }

  if (task.taskKind === "bathroom") {
    return "◫";
  }

  return null;
}

export function MonthCalendar({
  tasks,
  monthStart,
}: {
  tasks: CleaningTask[];
  monthStart: string;
}) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const { getTaskStatus, updateTaskStatus } = useTaskStatuses(tasks);
  const days = useMemo(() => getCalendarDays(monthStart), [monthStart]);
  const currentMonth = parseTaskDate(monthStart).getMonth();
  const todayKey = getBanffDateKey(new Date());

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getLoggedInUser());
    });
  }, []);

  const visibleTaskInstances = days.flatMap((day) => {
    const dayKey = getDateKey(day);

    return tasks
      .filter((task) => taskTouchesDay(task, day))
      .map((task) => ({ task, status: getTaskStatus(task, dayKey) }));
  });
  const completedCount = visibleTaskInstances.filter(
    (instance) => instance.status === "done",
  ).length;
  const skippedCount = visibleTaskInstances.filter(
    (instance) => instance.status === "skipped",
  ).length;
  const pendingCount =
    visibleTaskInstances.length - completedCount - skippedCount;

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-roof-800">
              Month view
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {monthFormatter.format(parseTaskDate(monthStart))}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
              {pendingCount} pending
            </span>
            <span className="rounded-full bg-olive-100 px-3 py-1 text-olive-700">
              {completedCount} done
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              {skippedCount} skipped
            </span>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[0.68rem] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
          {weekdayLabels.map((day) => (
            <div key={day} className="px-1 py-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayKey = getDateKey(day);
            const dayTasks = tasks
              .filter((task) => taskTouchesDay(task, day))
              .map((task) => ({
                ...task,
                status: getTaskStatus(task, dayKey),
              }));
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = dayKey === todayKey;
            const isPastDay = dayKey < todayKey;

            return (
              <div
                key={dayKey}
                className={`min-h-24 border-b border-r border-slate-200 p-1.5 sm:min-h-36 sm:p-2 ${isToday ? "bg-cream-50" : isPastDay ? "bg-slate-50 text-slate-400" : isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black ${isToday ? "bg-roof-800 text-white shadow-sm" : isPastDay ? "text-slate-400" : "text-slate-700"}`}
                  >
                    {dayFormatter.format(day)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 sm:block sm:space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const canUpdate =
                      !!user &&
                      dayKey <= todayKey &&
                      (user.role === "admin" ||
                        task.assignedUserIds.includes(user.id));
                    const nextStatus = nextStatuses[task.status];
                    const taskStyles = isPastDay
                      ? pastStatusStyles[task.status]
                      : statusStyles[task.status];
                    const taskIcon = getTaskKindIcon(task);
                    const disabledTitle =
                      dayKey > todayKey
                        ? "Future tasks can be updated once the day arrives."
                        : `${getTaskMonthLabel(task)} - assigned to ${task.assignedTo.join(", ")}`;

                    return (
                      <button
                        key={`${dayKey}-${task.id}`}
                        type="button"
                        className={`inline-flex min-h-5 max-w-full items-center justify-center rounded-full px-1.5 py-0.5 text-[0.62rem] font-black ring-1 transition sm:w-full sm:rounded-md sm:px-1.5 sm:py-1 sm:text-xs ${taskStyles} ${canUpdate ? "hover:-translate-y-0.5 hover:shadow-sm" : "cursor-not-allowed opacity-70"}`}
                        title={
                          canUpdate
                            ? `${getTaskMonthLabel(task)} - click for ${statusLabels[nextStatus]}`
                            : disabledTitle
                        }
                        disabled={!canUpdate}
                        onClick={() =>
                          updateTaskStatus(task, nextStatus, dayKey)
                        }
                      >
                        <span className="flex items-center justify-center gap-1 sm:hidden">
                          {taskIcon ? (
                            <span aria-hidden="true">{taskIcon}</span>
                          ) : null}
                          <span className="truncate">
                            {getAssigneeInitials(task)}
                          </span>
                        </span>
                        <span className="hidden truncate sm:block">
                          {task.status === "done" ? "Done: " : ""}
                          {task.status === "skipped" ? "Skipped: " : ""}
                          {getTaskMonthLabel(task)}
                        </span>
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 ? (
                    <p className="px-1 text-[0.68rem] font-black text-slate-500">
                      +{dayTasks.length - 3} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {tasks.length === 0 ? (
        <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-black">No calendar tasks this month</h2>
          <p className="mt-2 text-slate-600">
            Shared calendar events will appear here when scheduled.
          </p>
        </section>
      ) : null}
    </div>
  );
}
