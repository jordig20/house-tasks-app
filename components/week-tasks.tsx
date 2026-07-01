"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { getLoggedInUser, type LoggedInUser } from "@/lib/auth";
import {
  getLocalDateKey,
  getTaskDateRangeLabel,
  groupTasksByDay,
  isMultiDayTask,
  type CleaningTask,
  type TaskStatus,
} from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
});

const dailyStatusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  done: "bg-olive-100 text-olive-700 ring-olive-600/20",
  skipped: "bg-slate-100 text-slate-500 ring-slate-200",
};

function parseTaskDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

function getDisplayEndDate(task: CleaningTask) {
  const endDate = parseTaskDate(task.end);

  if (task.isAllDay) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return endDate;
}

function getVisibleDays(task: CleaningTask) {
  const startDate = parseTaskDate(task.start);
  const endDate = getDisplayEndDate(task);
  const days: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate && days.length < 7) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

export function WeekTasks({ tasks }: { tasks: CleaningTask[] }) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const { tasksWithStatus, getTaskStatus, updateTaskStatus } =
    useTaskStatuses(tasks);
  const multiDayTasks = tasksWithStatus.filter((task) => isMultiDayTask(task));
  const singleDayTasks = tasksWithStatus.filter((task) => !isMultiDayTask(task));
  const groupedTasks = groupTasksByDay(singleDayTasks);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getLoggedInUser());
    });
  }, []);

  return (
    <div className="space-y-4">
      {multiDayTasks.length > 0 ? (
        <section className="rounded-[2rem] border-2 border-roof-800/10 bg-roof-800 p-5 text-white shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cream-100">All week</p>
              <h2 className="mt-1 text-xl font-black">Weekly responsibilities</h2>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{multiDayTasks.length} events</span>
          </div>
          <div className="space-y-3">
            {multiDayTasks.map((task) => (
              <article key={task.id} className="rounded-2xl bg-white p-4 text-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{task.title}</h3>
                      <span className="rounded-full bg-cream-50 px-2 py-1 text-[0.68rem] font-black uppercase tracking-wide text-roof-800 ring-1 ring-cream-200">
                        {task.calendarName}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {task.assignedTo.length > 0 ? task.assignedTo.join(", ") : "Unassigned"} · {getTaskDateRangeLabel(task)}
                    </p>
                    <p className="mt-2 rounded-xl bg-cream-50 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-cream-200">
                      Trash and recycling can be marked separately each day.
                    </p>
                    {task.completionMode === "daily" ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-7">
                        {getVisibleDays(task).map((day) => {
                          const dateKey = getLocalDateKey(day);
                          const status = getTaskStatus(task, dateKey);
                          const canUpdate =
                            !!user &&
                            (user.role === "admin" ||
                              task.assignedUserIds.includes(user.id));
                          const nextStatus =
                            status === "done" ? "pending" : "done";

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => {
                                if (canUpdate) {
                                  updateTaskStatus(task, nextStatus, dateKey);
                                }
                              }}
                              className={`rounded-xl px-2 py-2 text-xs font-black ring-1 transition ${dailyStatusStyles[status]} ${canUpdate ? "hover:-translate-y-0.5 hover:shadow-sm" : "cursor-not-allowed opacity-55"}`}
                              disabled={!canUpdate}
                              title={
                                canUpdate
                                  ? "Toggle daily status"
                                  : `Assigned to ${task.assignedTo.join(", ")}`
                              }
                            >
                              <span className="block">
                                {dayFormatter.format(day)}
                              </span>
                              <span className="capitalize">{status}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge
                    status={
                      task.completionMode === "daily"
                        ? getTaskStatus(task)
                        : task.status
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {Object.entries(groupedTasks).map(([day, dayTasks]) => (
        <section key={day} className="rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">{day}</h2>
            <span className="text-sm font-bold text-slate-500">{dayTasks.length} events</span>
          </div>
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map((task) => (
                <article key={task.id} className="rounded-2xl bg-cream-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950">{task.title}</h3>
                        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-black uppercase tracking-wide text-roof-800 ring-1 ring-cream-200">
                          {task.calendarName}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {task.assignedTo.length > 0 ? task.assignedTo.join(", ") : "Unassigned"} · {getTaskDateRangeLabel(task)}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-cream-50 p-4 text-sm font-medium text-slate-500">No scheduled cleaning tasks.</p>
          )}
        </section>
      ))}
    </div>
  );
}
