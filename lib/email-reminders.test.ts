import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CleaningTask, HouseUser } from "@/lib/tasks";

const mocks = vi.hoisted(() => ({
  ensureCalendarTables: vi.fn(),
  getStoredCalendarTasks: vi.fn(),
  getStoredHouseUsers: vi.fn(),
  getStoredTaskStatuses: vi.fn(),
  resendSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return { emails: { send: mocks.resendSend } };
  }),
}));

vi.mock("@/lib/db", () => ({ sql: null }));
vi.mock("@/lib/banff-time", () => ({
  getBanffTodayRange: () => ({
    dateKey: "2026-07-15",
    start: new Date("2026-07-15T06:00:00.000Z"),
    end: new Date("2026-07-16T06:00:00.000Z"),
  }),
}));
vi.mock("@/lib/calendar-task-store", () => ({
  ensureCalendarTables: mocks.ensureCalendarTables,
  getStoredCalendarTasks: mocks.getStoredCalendarTasks,
}));
vi.mock("@/lib/task-status-store", () => ({
  getStoredTaskStatuses: mocks.getStoredTaskStatuses,
}));
vi.mock("@/lib/user-store", () => ({
  getStoredHouseUsers: mocks.getStoredHouseUsers,
}));

const { sendTaskReminderEmails } = await import("@/lib/email-reminders");

function task(overrides: Partial<CleaningTask> = {}): CleaningTask {
  return {
    id: "task-1",
    googleEventId: "event-1",
    calendarName: "Cleaning",
    calendarId: "calendar-1",
    sourceTitle: "Jordi - Trash",
    taskTitle: "Trash",
    title: "Trash",
    assignedTo: ["Jordi"],
    assignedUserIds: ["jordi"],
    taskKind: "trash",
    completionMode: "daily",
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

function user(overrides: Partial<HouseUser> = {}): HouseUser {
  return {
    id: "jordi",
    name: "Jordi",
    role: "member",
    pin: "1234",
    email: "jordi@example.com",
    emailRemindersEnabled: true,
    eveningRemindersEnabled: true,
    ...overrides,
  };
}

describe("sendTaskReminderEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mocks.getStoredHouseUsers.mockResolvedValue([user()]);
    mocks.getStoredTaskStatuses.mockResolvedValue({});
    mocks.resendSend.mockResolvedValue({});
  });

  it("sends reminder-only pending tasks for users with reminders enabled", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({
      tasks: [
        task({ id: "pending-task", title: "Take trash out" }),
        task({ id: "done-task", title: "Already done" }),
      ],
      warnings: [],
    });
    mocks.getStoredTaskStatuses.mockResolvedValue({
      "daily:done-task:2026-07-15": "done",
    });

    const result = await sendTaskReminderEmails("morning");

    expect(result).toEqual({ sent: 1, skipped: 0, warnings: [] });
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "You have one task today at 540A",
        text: expect.stringContaining("Take trash out"),
      }),
    );
    expect(mocks.resendSend.mock.calls[0][0].text).not.toContain("Already done");
  });

  it("skips users without the matching reminder preference", async () => {
    mocks.getStoredHouseUsers.mockResolvedValue([
      user({ id: "no-email", email: undefined }),
      user({ id: "disabled", emailRemindersEnabled: false }),
      user({ id: "no-evening", eveningRemindersEnabled: false }),
    ]);
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task()], warnings: [] });

    const result = await sendTaskReminderEmails("evening");

    expect(result).toEqual({ sent: 0, skipped: 3, warnings: [] });
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  it("returns a warning without loading tasks when the email provider is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(sendTaskReminderEmails("morning")).resolves.toEqual({
      sent: 0,
      skipped: 0,
      warnings: ["RESEND_API_KEY is not configured."],
    });
    expect(mocks.getStoredCalendarTasks).not.toHaveBeenCalled();
  });
});
