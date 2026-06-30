"use client";

import { StatusBadge } from "@/components/status-badge";
import { getTaskDateRangeLabel, groupTasksByDay, isMultiDayTask, type CleaningTask } from "@/lib/tasks";
import { useTaskStatuses } from "@/lib/use-task-statuses";

export function WeekTasks({ tasks }: { tasks: CleaningTask[] }) {
  const { tasksWithStatus } = useTaskStatuses(tasks);
  const multiDayTasks = tasksWithStatus.filter((task) => isMultiDayTask(task));
  const singleDayTasks = tasksWithStatus.filter((task) => !isMultiDayTask(task));
  const groupedTasks = groupTasksByDay(singleDayTasks);

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
                      Shows separately because this calendar event spans multiple days.
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
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
  );
}
