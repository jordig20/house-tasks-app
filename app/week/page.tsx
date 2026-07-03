import { AppShell } from "@/components/app-shell";
import { WeekTasks } from "@/components/week-tasks";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getWeekRange } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function CalendarWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 rounded-[2rem] bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
      {warnings.join(" ")}
    </section>
  );
}

export default async function WeekPage() {
  const { start, end } = getWeekRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return (
      <AppShell
        eyebrow={
          calendarTasks.isConfiguredFallback
            ? "Calendar sync needed"
            : "Google Calendar"
        }
      title="540A weekly plan"
    >
      <CalendarWarnings warnings={calendarTasks.warnings} />
      <WeekTasks tasks={calendarTasks.tasks} />
    </AppShell>
  );
}
