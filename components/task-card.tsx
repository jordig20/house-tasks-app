"use client";

import { getTaskDateRangeLabel, isMultiDayTask, type CleaningTask, type TaskStatus } from "@/lib/tasks";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";

export function TaskCard({
  task,
  status,
  onStatusChange,
}: {
  task: CleaningTask;
  status?: TaskStatus;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const currentStatus = status ?? task.status;
  const isMultiDay = isMultiDayTask(task);

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-roof-800">{isMultiDay ? "Weekly responsibility" : "Google Calendar task"}</p>
            <span className="rounded-full bg-cream-100 px-2 py-1 text-[0.68rem] font-black uppercase tracking-wide text-roof-800 ring-1 ring-cream-200">
              {task.calendarName}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-black leading-snug text-slate-950">{task.title}</h3>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="mt-4 rounded-2xl bg-cream-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned to</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {task.assignedTo.length > 0 ? (
                task.assignedTo.map((person) => (
                  <span key={person} className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-bold text-slate-950 shadow-sm ring-1 ring-cream-200">
                    <UserAvatar user={{ name: person, role: "member" }} size="sm" />
                    {person}
                  </span>
                ))
              ) : (
                <span className="text-sm font-bold text-slate-500">Unassigned</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Date</p>
            <p className="text-sm font-bold text-slate-950">{getTaskDateRangeLabel(task)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{task.dueLabel}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-white px-3 py-2 ring-1 ring-cream-200">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Source calendar title</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{task.sourceTitle}</p>
        </div>
      </div>

      {onStatusChange ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onStatusChange(task.id, "done")}
            className="rounded-full bg-roof-800 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
            disabled={currentStatus === "done"}
          >
            Mark done
          </button>
          <button
            onClick={() => onStatusChange(task.id, "skipped")}
            className="rounded-full bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60"
            disabled={currentStatus === "skipped"}
          >
            Skip
          </button>
        </div>
      ) : null}
    </article>
  );
}
