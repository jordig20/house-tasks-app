"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { getLoggedInUser, type LoggedInUser } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
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

const dailyStatusButtonStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-900 ring-amber-200",
  done: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  skipped: "bg-slate-100 text-slate-600 ring-slate-200",
};
const dailyStatusOptions: TaskStatus[] = ["pending", "done", "skipped"];
const dailyStatusLabels: Record<TaskStatus, string> = {
  pending: "Pend",
  done: "Done",
  skipped: "Skip",
};
const dailyNextStatus: Record<TaskStatus, TaskStatus> = {
  pending: "done",
  done: "skipped",
  skipped: "pending",
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

function getDailyTaskSummaryStatus(
  task: CleaningTask,
  getTaskStatus: (task: CleaningTask, date?: string) => TaskStatus,
) {
  const visibleDays = getVisibleDays(task);
  const statuses = visibleDays.map((day) =>
    getTaskStatus(task, getLocalDateKey(day)),
  );

  if (statuses.length > 0 && statuses.every((status) => status === "done")) {
    return "done";
  }

  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "skipped")
  ) {
    return "skipped";
  }

  return "pending";
}

export function WeekTasks({ tasks }: { tasks: CleaningTask[] }) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const { tasksWithStatus, getTaskStatus, updateTaskStatus } =
    useTaskStatuses(tasks);
  const todayKey = getBanffDateKey(new Date());
  const multiDayTasks = tasksWithStatus.filter((task) => isMultiDayTask(task));
  const singleDayTasks = tasksWithStatus.filter((task) => !isMultiDayTask(task));
  const groupedTasks = groupTasksByDay(singleDayTasks);
  const showCalendarChip = new Set(tasks.map((task) => task.calendarName)).size > 1;
  const canUpdateTask = (task: CleaningTask, dateKey: string) =>
    !!user &&
    dateKey <= todayKey &&
    (user.role === "admin" || task.assignedUserIds.includes(user.id));
  const getDisabledTitle = (task: CleaningTask, dateKey: string) => {
    if (dateKey > todayKey) {
      return "Future tasks can be updated once the day arrives.";
    }

    if (!user || !task.assignedUserIds.includes(user.id)) {
      return `Assigned to ${task.assignedTo.join(", ")}`;
    }

    return undefined;
  };

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getLoggedInUser());
    });
  }, []);

  return (
    <div className="space-y-4">
      {multiDayTasks.length > 0 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 text-slate-950 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">All week</p>
              <h2 className="mt-1 text-xl font-black">Weekly responsibilities</h2>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-bold text-white">{multiDayTasks.length} {multiDayTasks.length === 1 ? "event" : "events"}</span>
          </div>
          <div className="space-y-3">
            {multiDayTasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-950 sm:p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950">{task.title}</h3>
                        {showCalendarChip ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-black uppercase tracking-wide text-cyan-700 ring-1 ring-slate-200">
                            {task.calendarName}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {task.assignedTo.length > 0
                          ? task.assignedTo.join(", ")
                          : "Unassigned"} · {getTaskDateRangeLabel(task)}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        task.completionMode === "daily"
                          ? getDailyTaskSummaryStatus(task, getTaskStatus)
                          : task.status
                      }
                    />
                  </div>

                  {task.completionMode === "daily" ? (
                    <div>
                      <p className="mb-2 text-[0.68rem] font-black uppercase tracking-wide text-slate-400">
                        Mark each day separately
                      </p>
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {getVisibleDays(task).map((day) => {
                          const dateKey = getLocalDateKey(day);
                          const status = getTaskStatus(task, dateKey);
                          const canUpdate = canUpdateTask(task, dateKey);
                          const nextStatus = dailyNextStatus[status];

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => updateTaskStatus(task, nextStatus, dateKey)}
                              disabled={!canUpdate}
                              title={!canUpdate ? getDisabledTitle(task, dateKey) : undefined}
                              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[0.58rem] font-black ring-1 transition disabled:cursor-not-allowed sm:gap-1 sm:rounded-xl sm:p-2 sm:text-xs ${dailyStatusButtonStyles[status]} ${canUpdate ? "hover:-translate-y-0.5 hover:shadow-sm" : "opacity-55"}`}
                            >
                              <span className="truncate text-center leading-tight">
                                {dayFormatter.format(day)}
                              </span>
                              <span className="text-[0.55rem] uppercase tracking-wide sm:text-[0.62rem]">
                                {dailyStatusLabels[status]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {Object.entries(groupedTasks).map(([day, dayTasks]) => (
        <section key={day} className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">{day}</h2>
            <span className="text-sm font-bold text-slate-500">{dayTasks.length} {dayTasks.length === 1 ? "event" : "events"}</span>
          </div>
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map((task) => (
                <article key={task.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950">{task.title}</h3>
                        {showCalendarChip ? (
                          <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-black uppercase tracking-wide text-cyan-700 ring-1 ring-slate-200">
                            {task.calendarName}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {task.assignedTo.length > 0 ? task.assignedTo.join(", ") : "Unassigned"} · {getTaskDateRangeLabel(task)}
                      </p>
                      <div
                        className="mt-3 grid max-w-sm grid-cols-3 gap-1"
                        title={
                          !canUpdateTask(task, task.date)
                            ? getDisabledTitle(task, task.date)
                            : undefined
                        }
                      >
                        {dailyStatusOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateTaskStatus(task, option)}
                            className={`rounded-xl px-3 py-2 text-xs font-black capitalize ring-1 transition disabled:cursor-not-allowed disabled:opacity-55 ${task.status === option ? dailyStatusButtonStyles[option] : "bg-white/80 text-slate-500 ring-slate-200"} ${canUpdateTask(task, task.date) ? "hover:-translate-y-0.5 hover:shadow-sm" : ""}`}
                            disabled={!canUpdateTask(task, task.date)}
                          >
                            {dailyStatusLabels[option]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">No scheduled cleaning tasks.</p>
          )}
        </section>
      ))}
    </div>
  );
}
