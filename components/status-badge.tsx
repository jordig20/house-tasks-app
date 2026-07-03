import type { TaskStatus } from "@/lib/tasks";

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-amber-500 text-white ring-amber-600",
  done: "bg-emerald-600 text-white ring-emerald-700",
  skipped: "bg-slate-700 text-white ring-slate-800",
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
