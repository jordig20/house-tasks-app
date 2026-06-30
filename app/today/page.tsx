"use client";

import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { getTodayTasks } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

const todayTasks = getTodayTasks();

export default function TodayPage() {
  const { tasksWithStatus, updateStatus } = useTaskStatuses(todayTasks);
  const completedCount = tasksWithStatus.filter((task) => task.status === "done").length;
  const progressWidth = tasksWithStatus.length > 0 ? (completedCount / tasksWithStatus.length) * 100 : 0;

  return (
    <AppShell eyebrow="Google Calendar preview" title="Today at 540A">
      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Mock calendar events parsed for today</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-roof-800" style={{ width: `${progressWidth}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">{completedCount} of {tasksWithStatus.length} calendar tasks done</p>
      </section>

      <div className="space-y-4">
        {tasksWithStatus.map((task) => (
          <TaskCard key={task.id} task={task} status={task.status} onStatusChange={updateStatus} />
        ))}
      </div>
    </AppShell>
  );
}
