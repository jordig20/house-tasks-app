import type { CleaningTask } from "@/lib/tasks";

const statusStyles = {
  done: "bg-sage-100 text-sage-700",
  pending: "bg-coral/15 text-orange-900",
  upcoming: "bg-slate-100 text-slate-700",
};

export function TaskCard({ task }: { task: CleaningTask }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sage-700">{task.room}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{task.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[task.status]}`}>
          {task.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <p><span className="font-medium text-slate-900">Who:</span> {task.assignee}</p>
        <p><span className="font-medium text-slate-900">When:</span> {task.scheduledFor}</p>
        <p><span className="font-medium text-slate-900">Time:</span> {task.durationMinutes} min</p>
      </div>
    </article>
  );
}
