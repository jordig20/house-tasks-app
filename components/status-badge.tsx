import type { TaskStatus } from "@/lib/tasks";

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  done: "bg-sage-100 text-sage-700 ring-sage-200",
  skipped: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  done: "Done",
  skipped: "Skipped",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
