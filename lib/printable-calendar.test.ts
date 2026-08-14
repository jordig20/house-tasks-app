import { describe, expect, it } from "vitest";
import type { CleaningTask } from "@/lib/tasks";
import {
  buildPrintableCalendar,
  getMonthStartKey,
  shiftMonth,
} from "@/lib/printable-calendar";

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
    start: "2026-08-01",
    end: "2026-08-04",
    date: "2026-08-01",
    isAllDay: true,
    dueLabel: "All week",
    dateLabel: "Saturday, Aug 1",
    day: "Saturday",
    status: "pending",
    durationMinutes: 0,
    ...overrides,
  };
}

describe("printable monthly calendar", () => {
  it("builds complete Sunday-to-Saturday weeks with adjacent month cells", () => {
    const days = buildPrintableCalendar("2026-08-01", []);

    expect(days).toHaveLength(42);
    expect(days[0]).toMatchObject({ dateKey: "2026-07-26", isCurrentMonth: false });
    expect(days[6]).toMatchObject({ dateKey: "2026-08-01", isCurrentMonth: true });
    expect(days.at(-1)).toMatchObject({ dateKey: "2026-09-05", isCurrentMonth: false });
  });

  it("groups multi-day tasks on each visible day and respects all-day exclusive ends", () => {
    const days = buildPrintableCalendar("2026-08-01", [task()]);

    expect(days.find((day) => day.dateKey === "2026-08-01")?.tasks).toHaveLength(1);
    expect(days.find((day) => day.dateKey === "2026-08-03")?.tasks).toHaveLength(1);
    expect(days.find((day) => day.dateKey === "2026-08-04")?.tasks).toHaveLength(0);
  });

  it("keeps late Edmonton timed events on their local end date under UTC", () => {
    const timedTask = task({
      start: "2026-08-01T22:30:00-06:00",
      end: "2026-08-01T23:30:00-06:00",
      date: "2026-08-01",
      isAllDay: false,
    });
    const days = buildPrintableCalendar("2026-08-01", [timedTask]);

    expect(days.find((day) => day.dateKey === "2026-08-01")?.tasks).toHaveLength(1);
    expect(days.find((day) => day.dateKey === "2026-08-02")?.tasks).toHaveLength(0);
  });

  it("includes each Banff date touched by a timed multi-day event", () => {
    const timedTask = task({
      start: "2026-08-01T23:30:00-06:00",
      end: "2026-08-02T00:30:00-06:00",
      date: "2026-08-01",
      isAllDay: false,
    });
    const days = buildPrintableCalendar("2026-08-01", [timedTask]);

    expect(days.find((day) => day.dateKey === "2026-08-01")?.tasks).toHaveLength(1);
    expect(days.find((day) => day.dateKey === "2026-08-02")?.tasks).toHaveLength(1);
  });

  it("navigates across year boundaries using stable month keys", () => {
    expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-12-01", 1)).toBe("2027-01-01");
    expect(getMonthStartKey("2026-08-14")).toBe("2026-08-01");
  });
});
