import { AppShell } from "@/components/app-shell";
import { getCalendarTasks, getWeekRange } from "@/lib/google-calendar";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { start, end } = getWeekRange();
  const calendarTasks = await getCalendarTasks(start, end);

  return (
    <AppShell eyebrow="Admin" title="540A house members" requireAdmin>
      <UsersAdmin tasks={calendarTasks.tasks} />
    </AppShell>
  );
}
