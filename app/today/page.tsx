"use client";

import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { getTodayTasks } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

const todayTasks = getTodayTasks();

export default function TodayPage() {
  const { tasksWithStatus, updateStatus } = useTaskStatuses(todayTasks);
  const completedCount = tasksWithStatus.filter((task) => task.status === "done").length;

  return (
    <AppShell eyebrow="Daily view" title="Today's cleaning tasks">
      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Progress</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sage-700" style={{ width: `${(completedCount / tasksWithStatus.length) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">{completedCount} of {tasksWithStatus.length} tasks done</p>
      </section>

      <div className="space-y-4">
        {tasksWithStatus.map((task) => (
          <TaskCard key={task.id} task={task} status={task.status} onStatusChange={updateStatus} />
        ))}
      </div>
    </AppShell>
  );
}
