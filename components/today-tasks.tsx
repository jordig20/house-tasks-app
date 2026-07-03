"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/task-card";
import { getLoggedInUser, type LoggedInUser } from "@/lib/auth";
import { getBanffDateKey } from "@/lib/banff-time";
import { useTaskStatuses } from "@/lib/use-task-statuses";
import type { CleaningTask } from "@/lib/tasks";

const taskTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getTaskStartLabel(task: CleaningTask) {
  if (task.isAllDay) {
    return "All day";
  }

  return taskTimeFormatter.format(new Date(task.start));
}

export function TodayTasks({ tasks }: { tasks: CleaningTask[] }) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const { getTaskStatus, updateTaskStatus } = useTaskStatuses(tasks);
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

  const tasksWithTodayStatus = visibleTasks.map((task) => ({
    ...task,
    status: getTaskStatus(task, todayKey),
  }));
  const completedCount = tasksWithTodayStatus.filter((task) => task.status === "done").length;
  const total = tasksWithTodayStatus.length;
  const progressWidth = total > 0 ? (completedCount / total) * 100 : 0;
  const showCalendarChip = new Set(tasks.map((task) => task.calendarName)).size > 1;
  const nextTask = tasksWithTodayStatus
    .filter((task) => task.status !== "done")
    .sort(
      (firstTask, secondTask) =>
        new Date(firstTask.start).getTime() -
        new Date(secondTask.start).getTime(),
    )[0];

  return (
    <>
      <section className="mb-5 rounded-[2rem] bg-roof-800 p-5 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cream-100">
          Your next task
        </p>
        {nextTask ? (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black leading-tight">
                {nextTask.title}
              </h2>
              <p className="mt-1 text-sm font-bold text-cream-100">
                {getTaskStartLabel(nextTask)} · {nextTask.assignedTo.length > 0
                  ? nextTask.assignedTo.join(", ")
                  : "Unassigned"}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-roof-800">
              Up next
            </span>
          </div>
        ) : (
          <p className="mt-3 text-xl font-black">All caught up for today.</p>
        )}
      </section>

      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">
          Merged read-only Google Calendar events for today
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-roof-800" style={{ width: `${progressWidth}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">
          {completedCount} of {total} calendar tasks done
        </p>
      </section>

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
            <h2 className="text-xl font-black">No calendar tasks today</h2>
            <p className="mt-2 text-slate-600">Shared calendar events will appear here when scheduled.</p>
          </section>
        )}
      </div>
    </>
  );
}
