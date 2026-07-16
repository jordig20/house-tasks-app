"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/task-card";
import { getLoggedInUser, type LoggedInUser } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
import { getTaskInstances } from "@/lib/task-instances";
import { useTaskStatuses } from "@/lib/use-task-statuses";
import { type CleaningTask, type TaskStatus } from "@/lib/tasks";

const taskTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const taskDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function getTaskStartLabel(task: CleaningTask) {
  if (task.isAllDay) {
    return "All day";
  }

  return taskTimeFormatter.format(new Date(task.start));
}

function getTaskNextLabel(task: CleaningTask, dateKey: string, todayKey: string) {
  if (dateKey === todayKey) {
    return getTaskStartLabel(task);
  }

  return `${taskDayFormatter.format(new Date(`${dateKey}T00:00:00`))} · ${getTaskStartLabel(task)}`;
}

type UpcomingTask = CleaningTask & {
  dateKey: string;
  sortTime: number;
  status: TaskStatus;
};

export function TodayTasks({
  tasks,
  upcomingTasks = tasks,
}: {
  tasks: CleaningTask[];
  upcomingTasks?: CleaningTask[];
}) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const { getTaskStatus, statusUpdateError, updateTaskStatus } =
    useTaskStatuses(tasks);
  const todayKey = getBanffDateKey(new Date());

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getLoggedInUser());
    });
  }, []);

  const visibleTasks = useMemo(() => {
    if (!user || user.role === "admin") {
      return tasks;
    }

    return tasks.filter((task) => task.assignedUserIds.includes(user.id));
  }, [tasks, user]);
  const visibleUpcomingTasks = useMemo(() => {
    if (!user || user.role === "admin") {
      return upcomingTasks;
    }

    return upcomingTasks.filter((task) => task.assignedUserIds.includes(user.id));
  }, [upcomingTasks, user]);

  const tasksWithTodayStatus = visibleTasks.map((task) => ({
    ...task,
    status: getTaskStatus(task, todayKey),
  }));
  const completedCount = tasksWithTodayStatus.filter((task) => task.status === "done").length;
  const total = tasksWithTodayStatus.length;
  const progressWidth = total > 0 ? (completedCount / total) * 100 : 0;
  const showCalendarChip = new Set(tasks.map((task) => task.calendarName)).size > 1;
  const nextTask = visibleUpcomingTasks
    .flatMap<UpcomingTask>((task) => {
      return getTaskInstances(task).map(({ dateKey, sortTime }) => ({
          ...task,
          dateKey,
          sortTime,
          status: getTaskStatus(task, dateKey),
        }));
    })
    .filter((task) => task.dateKey >= todayKey && task.status !== "done")
    .sort(
      (firstTask, secondTask) =>
        firstTask.sortTime - secondTask.sortTime,
    )[0];

  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.24)] ring-1 ring-white/10">
        <p className="font-ui text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
          Your next task
        </p>
        {nextTask ? (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight">
                {nextTask.title}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-300">
                {getTaskNextLabel(nextTask, nextTask.dateKey, todayKey)} · {nextTask.assignedTo.length > 0
                  ? nextTask.assignedTo.join(", ")
                  : "Unassigned"}
              </p>
            </div>
            <span className="rounded-full bg-cyan-300 px-3 py-1 font-ui text-sm font-black text-slate-950">
              Up next
            </span>
          </div>
        ) : (
          <p className="mt-3 font-display text-xl font-bold">All caught up for today.</p>
        )}
      </section>

      <section className="mb-5 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <p className="font-ui text-sm font-bold text-slate-500">
          {user?.role === "admin" ? "Synced calendar tasks for today" : "Today progress"}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${progressWidth}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">
          {completedCount} of {total} calendar tasks done
        </p>
      </section>

      {statusUpdateError ? (
        <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-ui text-sm font-bold text-red-700">
          {statusUpdateError.message}
        </p>
      ) : null}

      <div className="space-y-4">
        {total > 0 ? (
          tasksWithTodayStatus.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={task.status}
              showCalendarChip={showCalendarChip}
              onStatusChange={(selectedTask, status) =>
                updateTaskStatus(selectedTask, status, todayKey)
              }
            />
          ))
        ) : (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
          <h2 className="font-display text-xl font-bold">No calendar tasks today</h2>
            <p className="mt-2 text-slate-600">Shared calendar events will appear here when scheduled.</p>
          </section>
        )}
      </div>
    </>
  );
}
