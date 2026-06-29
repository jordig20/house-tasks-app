"use client";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getAssigneeName, groupTasksByDay, mockTasks } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

export default function WeekPage() {
  const { tasksWithStatus } = useTaskStatuses(mockTasks);
  const groupedTasks = groupTasksByDay(tasksWithStatus);

  return (
    <AppShell eyebrow="Weekly overview" title="This week's chore plan">
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([day, tasks]) => (
          <section key={day} className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{day}</h2>
              <span className="text-sm font-bold text-slate-500">{tasks.length} tasks</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article key={task.id} className="rounded-2xl bg-sage-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{task.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{task.room} · {getAssigneeName(task.assigneeId)} · {task.dueLabel}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-sage-50 p-4 text-sm font-medium text-slate-500">No scheduled cleaning tasks.</p>
            )}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
