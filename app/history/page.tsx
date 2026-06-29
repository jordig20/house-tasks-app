import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { historyTasks } from "@/lib/tasks";

export default function HistoryPage() {
  return (
    <AppShell eyebrow="Completed work" title="Cleaning history">
      <div className="space-y-4">
        {historyTasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </AppShell>
  );
}
