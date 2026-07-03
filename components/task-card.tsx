"use client";

import {
  getTaskDateRangeLabel,
  type CleaningTask,
  type TaskStatus,
} from "@/lib/tasks";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";

export function TaskCard({
  task,
  status,
  showCalendarChip = false,
  onStatusChange,
}: {
  task: CleaningTask;
  status?: TaskStatus;
  showCalendarChip?: boolean;
  onStatusChange?: (task: CleaningTask, status: TaskStatus) => void;
}) {
  const currentStatus = status ?? task.status;

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-black leading-snug text-slate-950">{task.title}</h3>
          {showCalendarChip ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
              {task.calendarName}
            </p>
          ) : null}
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned to</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {task.assignedTo.length > 0 ? (
                task.assignedTo.map((person) => (
                  <span key={person} className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
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
            {task.dueLabel && task.completionMode !== "daily" ? (
              <p className="mt-1 text-xs font-bold text-slate-500">{task.dueLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      {onStatusChange ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onStatusChange(task, "done")}
            className="rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            disabled={currentStatus === "done"}
          >
            Mark done
          </button>
          <button
            onClick={() => onStatusChange(task, "skipped")}
            className="rounded-full bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            disabled={currentStatus === "skipped"}
          >
            Skip
          </button>
        </div>
      ) : null}
    </article>
  );
}
