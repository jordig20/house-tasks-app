import { LoginScreen } from "@/components/login-screen";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getMonthRange } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { start, end } = getMonthRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return <LoginScreen tasks={calendarTasks.tasks} />;
}
