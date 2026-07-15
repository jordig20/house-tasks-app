import { describe, expect, it } from "vitest";
import {
  getTaskCompletionKey,
  getTaskCompletionMode,
  getTaskDateRangeLabel,
  getUserIdFromName,
  isMultiDayTask,
  parseCalendarTaskTitle,
  type CleaningTask,
} from "@/lib/tasks";

function task(overrides: Partial<CleaningTask> = {}): CleaningTask {
  return {
    id: "task-1",
    googleEventId: "event-1",
    calendarName: "Cleaning",
    calendarId: "calendar-1",
    sourceTitle: "Jordi & Ana - Bathroom",
    taskTitle: "Bathroom",
    title: "Bathroom",
    assignedTo: ["Jordi", "Ana"],
    assignedUserIds: ["jordi", "ana"],
    taskKind: "bathroom",
    completionMode: "event",
    start: "2026-07-15",
    end: "2026-07-16",
    date: "2026-07-15",
    isAllDay: true,
    dueLabel: "All day",
    dateLabel: "Wednesday, Jul 15",
    day: "Wednesday",
    status: "pending",
    durationMinutes: 0,
    ...overrides,
  };
}

describe("parseCalendarTaskTitle", () => {
  it("parses ampersand-separated assignees and normalizes user ids", () => {
    expect(parseCalendarTaskTitle("Jordi & Ána María - Bathroom reset")).toEqual({
      assignedTo: ["Jordi", "Ána María"],
      assignedUserIds: ["jordi", "ana-maria"],
      taskKind: "bathroom",
      taskTitle: "Bathroom reset",
    });
  });

  it("characterizes titles without spaced dash separators as unassigned tasks", () => {
    expect(parseCalendarTaskTitle("Trash - no people?" )).toEqual({
      assignedTo: ["Trash"],
      assignedUserIds: ["trash"],
      taskKind: "other",
      taskTitle: "no people?",
    });
  });

  it("falls back to member for names that normalize to an empty id", () => {
    expect(getUserIdFromName(" !!! ")).toBe("member");
  });
});

describe("task completion behavior", () => {
  it("uses daily completion for trash and event completion for other tasks", () => {
    expect(getTaskCompletionMode({ taskKind: "trash" })).toBe("daily");
    expect(getTaskCompletionMode({ taskKind: "bathroom" })).toBe("event");
  });

  it("generates daily keys per date and event keys per task", () => {
    const trashTask = task({ completionMode: "daily", taskKind: "trash" });
    const bathroomTask = task({ completionMode: "event", taskKind: "bathroom" });

    expect(getTaskCompletionKey(trashTask, "2026-07-16")).toBe(
      "daily:task-1:2026-07-16",
    );
    expect(getTaskCompletionKey(bathroomTask, "2026-07-16")).toBe("event:task-1");
  });
});

describe("multi-day task labels", () => {
  it("characterizes all-day exclusive end dates as display labels ending the previous day", () => {
    const allDayTask = task({
      start: "2026-07-15",
      end: "2026-07-18",
      isAllDay: true,
    });

    expect(isMultiDayTask(allDayTask)).toBe(true);
    expect(getTaskDateRangeLabel(allDayTask)).toBe("Jul 15 - Jul 17");
  });

  it("keeps single-day labels unchanged", () => {
    expect(getTaskDateRangeLabel(task())).toBe("Wednesday, Jul 15");
  });
});
