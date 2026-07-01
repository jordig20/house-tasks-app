import { AppShell } from "@/components/app-shell";
import { MonthCalendar } from "@/components/month-calendar";
import { getCalendarTasks, getMonthRange } from "@/lib/google-calendar";

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

export default async function MonthPage() {
  const { start, end, monthStart } = getMonthRange();
  const calendarTasks = await getCalendarTasks(start, end);

  return (
    <AppShell
      eyebrow={
        calendarTasks.isConfiguredFallback
          ? "Google Calendar setup needed"
          : "Google Calendar"
      }
      title="540A monthly calendar"
      wide
    >
      <CalendarWarnings warnings={calendarTasks.warnings} />
      <MonthCalendar
        tasks={calendarTasks.tasks}
        monthStart={monthStart.toISOString()}
      />
    </AppShell>
  );
}
