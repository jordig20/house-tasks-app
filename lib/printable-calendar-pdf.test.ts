import { describe, expect, it } from "vitest";
import type { CleaningTask } from "@/lib/tasks";
import { buildPrintableCalendar } from "@/lib/printable-calendar";
import { buildPrintableCalendarPdf } from "@/lib/printable-calendar-pdf";

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

const users = [
  { id: "admin", name: "Admin", role: "admin" as const, color: "brown" },
  { id: "taylor", name: "Taylor", role: "member" as const, color: "teal" },
];

describe("printable calendar pdf", () => {
  it("renders an A4 landscape PDF with the month title and weekday header", () => {
    const days = buildPrintableCalendar("2026-08-01", []);
    const doc = buildPrintableCalendarPdf({
      monthLabel: "August 2026",
      monthStart: "2026-08-01",
      days,
      users,
    });

    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight());
    expect(doc.output("blob").size).toBeGreaterThan(1000);
  });

  it("omits the Google Calendar copy and uses the household schedule label", () => {
    const days = buildPrintableCalendar("2026-08-01", []);
    const doc = buildPrintableCalendarPdf({
      monthLabel: "August 2026",
      monthStart: "2026-08-01",
      days,
      users,
    });

    const output = doc.output();
    expect(output).not.toMatch(/Tasks from Google Calendar/);
  });

  it("lists each task with the assignee color swatch", () => {
    const days = buildPrintableCalendar("2026-08-01", [
      task({ title: "Trash out", assignedUserIds: ["taylor"] }),
    ]);
    const doc = buildPrintableCalendarPdf({
      monthLabel: "August 2026",
      monthStart: "2026-08-01",
      days,
      users,
    });

    const output = doc.output();
    expect(output).toMatch(/Trash out/);
    expect(output).toMatch(/Taylor/);
  });
});
