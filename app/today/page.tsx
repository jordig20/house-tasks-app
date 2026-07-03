import { AppShell } from "@/components/app-shell";
import { TodayTasks } from "@/components/today-tasks";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getTodayRange } from "@/lib/google-calendar";

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

export default async function TodayPage() {
  const { start, end } = getTodayRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return (
      <AppShell
        eyebrow={
          calendarTasks.isConfiguredFallback
            ? "Calendar sync needed"
            : "Google Calendar"
        }
      title="Today at 540A"
    >
      <CalendarWarnings warnings={calendarTasks.warnings} />
      <TodayTasks tasks={calendarTasks.tasks} />
    </AppShell>
  );
}
