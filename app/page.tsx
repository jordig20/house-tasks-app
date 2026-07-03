import { HomeGate } from "@/components/home-gate";
import { getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getMonthRange } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { start, end } = getMonthRange();
  const calendarTasks = await getStoredCalendarTasks(start, end);

  return <HomeGate tasks={calendarTasks.tasks} />;
}
