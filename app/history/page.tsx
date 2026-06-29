"use client";

import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { mockTasks, recentHistory } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

export default function HistoryPage() {
  const { tasksWithStatus } = useTaskStatuses(mockTasks);
  const localHistory = tasksWithStatus.filter((task) => task.status === "done" || task.status === "skipped");
  const history = [...localHistory, ...recentHistory];

  return (
    <AppShell eyebrow="Recently updated" title="Cleaning history">
      <div className="space-y-4">
        {history.length > 0 ? (
          history.map((task) => <TaskCard key={`${task.id}-${task.status}`} task={task} status={task.status} />)
        ) : (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
            <p className="text-4xl" aria-hidden="true">🧽</p>
            <h2 className="mt-3 text-xl font-black">No local history yet</h2>
            <p className="mt-2 text-slate-600">Mark a task done or skipped to see it here.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
