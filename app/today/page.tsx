import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { todaysTasks } from "@/lib/tasks";

export default function TodayPage() {
  return (
    <AppShell eyebrow="Daily view" title="Today's cleaning tasks">
      <div className="space-y-4">
        {todaysTasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </AppShell>
  );
}
