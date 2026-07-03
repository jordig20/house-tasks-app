import { NextResponse } from "next/server";
import {
  getCurrentMonthSyncRange,
  replaceStoredCalendarTasks,
} from "@/lib/calendar-task-store";
import { getCalendarTasks } from "@/lib/google-calendar";

export async function POST() {
  try {
    const { start, end } = await getCurrentMonthSyncRange();
    const calendarTasks = await getCalendarTasks(start, end);

    if (calendarTasks.isConfiguredFallback) {
      return NextResponse.json(
        { message: calendarTasks.warnings.join(" ") },
        { status: 400 },
      );
    }

    await replaceStoredCalendarTasks(calendarTasks.tasks);

    return NextResponse.json({
      synced: calendarTasks.tasks.length,
      warnings: calendarTasks.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Calendar sync could not be completed.",
      },
      { status: 500 },
    );
  }
}
