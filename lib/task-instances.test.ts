import { describe, expect, it } from "vitest";
import {
  getBanffDateKey,
  getBanffMonthRange,
  getBanffTodayRange,
  getBanffWeekRange,
} from "@/lib/banff-time";
import {
  getTaskCompletionKey,
  getTaskDateRangeLabel,
  isMultiDayTask,
  type CleaningTask,
} from "@/lib/tasks";

function task(overrides: Partial<CleaningTask> = {}): CleaningTask {
  return {
    id: "task-1",
    googleEventId: "event-1",
    calendarName: "Cleaning",
    calendarId: "calendar-1",
    sourceTitle: "Taylor - Trash",
    taskTitle: "Trash",
    title: "Trash",
    assignedTo: ["Taylor"],
    assignedUserIds: ["taylor"],
    taskKind: "trash",
    completionMode: "daily",
    start: "2026-07-15",
    end: "2026-07-18",
    date: "2026-07-15",
    isAllDay: true,
    dueLabel: "All week",
    dateLabel: "Wednesday, Jul 15",
    day: "Wednesday",
    status: "pending",
    durationMinutes: 0,
    ...overrides,
  };
}

describe("Banff date boundaries", () => {
  it("uses the Banff calendar day instead of UTC for date keys", () => {
    expect(getBanffDateKey(new Date("2026-07-15T05:30:00.000Z"))).toBe(
      "2026-07-14",
    );
    expect(getBanffDateKey(new Date("2026-07-15T06:30:00.000Z"))).toBe(
      "2026-07-15",
    );
  });

  it("returns a Banff today range whose end is the next Banff midnight", () => {
    const range = getBanffTodayRange(new Date("2026-07-15T12:00:00.000Z"));

    expect(range.dateKey).toBe("2026-07-15");
    expect(range.start.toISOString()).toBe("2026-07-15T06:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-16T06:00:00.000Z");
  });

  it("characterizes week and month ranges as Banff-midnight UTC instants", () => {
    const week = getBanffWeekRange(new Date("2026-07-15T12:00:00.000Z"));
    const month = getBanffMonthRange(new Date("2026-07-15T12:00:00.000Z"));

    expect(week.start.toISOString()).toBe("2026-07-12T06:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-07-19T06:00:00.000Z");
    expect(week.startKey).toBe("2026-07-12");
    expect(week.endKey).toBe("2026-07-18");
    expect(month.start.toISOString()).toBe("2026-06-28T06:00:00.000Z");
    expect(month.end.toISOString()).toBe("2026-08-02T06:00:00.000Z");
    expect(month.monthStartKey).toBe("2026-07-01");
  });
});

describe("task instance characterization", () => {
  it("treats all-day end dates as exclusive when labeling multi-day tasks", () => {
    const multiDayTask = task();

    expect(isMultiDayTask(multiDayTask)).toBe(true);
    expect(getTaskDateRangeLabel(multiDayTask)).toBe("Jul 15 - Jul 17");
  });

  it("characterizes per-day status identity before shared instance extraction", () => {
    const multiDayTask = task();

    expect(getTaskCompletionKey(multiDayTask, "2026-07-15")).toBe(
      "daily:task-1:2026-07-15",
    );
    expect(getTaskCompletionKey(multiDayTask, "2026-07-16")).toBe(
      "daily:task-1:2026-07-16",
    );
  });
});
