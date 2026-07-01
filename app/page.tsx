import { HomeGate } from "@/components/home-gate";
import { getCalendarTasks, getMonthRange } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { start, end } = getMonthRange();
  const calendarTasks = await getCalendarTasks(start, end);

  return <HomeGate tasks={calendarTasks.tasks} />;
}
