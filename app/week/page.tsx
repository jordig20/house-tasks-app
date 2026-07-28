import { AppShell } from "@/components/app-shell";
import { WeekTasks } from "@/components/week-tasks";
import { getBanffWeekRange } from "@/lib/banff-time";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";

export const dynamic = "force-dynamic";

function CalendarWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section role="status" className="status-message mb-5 border border-amber-200 bg-amber-50 p-4 text-amber-900">
      {warnings.join(" ")}
    </section>
  );
}

export default async function WeekPage() {
  const { start, end, startKey, endKey } = getBanffWeekRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return (
      <AppShell
        eyebrow={
          calendarTasks.isConfiguredFallback
            ? "Calendar sync needed"
            : "Weekly plan"
        }
      title="540A weekly plan"
    >
      <CalendarWarnings warnings={calendarTasks.warnings} />
      <WeekTasks tasks={calendarTasks.tasks} weekRange={{ startKey, endKey }} />
    </AppShell>
  );
}
