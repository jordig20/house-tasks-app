import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { weekTasks } from "@/lib/tasks";

export default function WeekPage() {
  return (
    <AppShell eyebrow="Weekly schedule" title="This week at home">
      <div className="space-y-4">
        {weekTasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </AppShell>
  );
}
