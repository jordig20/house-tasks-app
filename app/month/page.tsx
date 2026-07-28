import { AppShell } from "@/components/app-shell";
import { MonthCalendar } from "@/components/month-calendar";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getMonthRange } from "@/lib/google-calendar";

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

export default async function MonthPage() {
  const { start, end, monthStartKey } = getMonthRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return (
      <AppShell
        eyebrow={
          calendarTasks.isConfiguredFallback
            ? "Calendar sync needed"
            : "Monthly view"
        }
      title="540A monthly calendar"
      wide
    >
      <CalendarWarnings warnings={calendarTasks.warnings} />
      <MonthCalendar
        tasks={calendarTasks.tasks}
        monthStart={monthStartKey}
      />
    </AppShell>
  );
}
