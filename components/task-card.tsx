"use client";

import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { getAssigneeName } from "@/lib/tasks";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { mockUsers } from "@/lib/tasks";

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
  const assignee = mockUsers.find((user) => user.id === task.assigneeId);

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-roof-800">{task.room}</p>
          <h3 className="mt-1 text-lg font-black leading-snug text-slate-950">{task.title}</h3>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cream-50 p-3">
        <div className="flex items-center gap-3">
          {assignee ? <UserAvatar user={assignee} size="sm" /> : null}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned to</p>
            <p className="font-bold text-slate-950">{getAssigneeName(task.assigneeId)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Due</p>
          <p className="text-sm font-bold text-slate-950">{task.dueLabel}</p>
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
