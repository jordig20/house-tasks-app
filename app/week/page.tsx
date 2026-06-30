"use client";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { groupTasksByDay, mockTasks } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

export default function WeekPage() {
  const { tasksWithStatus } = useTaskStatuses(mockTasks);
  const groupedTasks = groupTasksByDay(tasksWithStatus);

  return (
    <AppShell eyebrow="Google Calendar preview" title="540A weekly plan">
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([day, tasks]) => (
          <section key={day} className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{day}</h2>
              <span className="text-sm font-bold text-slate-500">{tasks.length} events</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article key={task.id} className="rounded-2xl bg-cream-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-950">{task.title}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-600">
                          {task.assignedTo.length > 0 ? task.assignedTo.join(", ") : "Unassigned"} · {task.dateLabel}
                        </p>
                        <p className="mt-2 truncate rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-cream-200">
                          {task.sourceTitle}
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
    </AppShell>
  );
}
