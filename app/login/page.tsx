import { LoginScreen } from "@/components/login-screen";
import { getCalendarTasks, getMonthRange } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { start, end } = getMonthRange();
  const calendarTasks = await getCalendarTasks(start, end);

  return <LoginScreen tasks={calendarTasks.tasks} />;
}
