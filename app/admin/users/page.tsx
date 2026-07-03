import { AppShell } from "@/components/app-shell";
import { CalendarSyncCard } from "@/components/calendar-sync-card";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getWeekRange } from "@/lib/google-calendar";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { start, end } = getWeekRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return (
    <AppShell eyebrow="Admin" title="540A house members" requireAdmin>
      <CalendarSyncCard />
      <UsersAdmin tasks={calendarTasks.tasks} />
    </AppShell>
  );
}
