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

function build(options: { tasks: CleaningTask[]; monthStart?: string }) {
  return buildPrintableCalendarPdf({
    monthLabel: "August 2026",
    monthStart: options.monthStart ?? "2026-08-01",
    days: buildPrintableCalendar(options.monthStart ?? "2026-08-01", options.tasks),
    users,
  });
}

describe("printable calendar pdf", () => {
  it("renders an A4 landscape PDF with a single page", () => {
    const doc = build({ tasks: [] });

    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight());
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output("blob").size).toBeGreaterThan(1000);
  });

  it("keeps the header copy to Household schedule and drops the Google reference", () => {
    const raw = build({ tasks: [] }).output();
    expect(raw).toMatch(/Household schedule/);
    expect(raw).not.toMatch(/Tasks from Google Calendar/);
  });

  it("renders the styled sheet, weekday band and at least one task card", () => {
    const raw = build({
      tasks: [task({ id: "t-1", title: "Trash out", assignedUserIds: ["taylor"] })],
    }).output();

    expect(raw).toMatch(/Trash out/);
    expect(raw).toMatch(/Taylor/);
    expect(raw).toMatch(/SUNDAY/);
  });

  it("never throws when a single day holds many tasks", () => {
    expect(() =>
      build({
        tasks: Array.from({ length: 12 }, (_, index) =>
          task({ id: `t-${index}`, title: `Task ${index + 1}` }),
        ),
      }).output("blob"),
    ).not.toThrow();
  });

  it("never includes a full overflowing title in the rendered PDF", () => {
    const longTitle =
      "Clean the entire kitchen, scrub the oven, mop every floor, and wipe the windows";
    const raw = build({
      tasks: [task({ id: "t-long", title: longTitle, assignedUserIds: ["taylor"] })],
    }).output();

    expect(raw).toContain("Clean the entire");
    expect(raw).not.toContain(longTitle);
  });
});
