import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CleaningTask, HouseUser } from "@/lib/tasks";

const mocks = vi.hoisted(() => ({
  ensureCalendarTables: vi.fn(),
  getStoredCalendarTasks: vi.fn(),
  getStoredHouseUsers: vi.fn(),
  getStoredTaskStatuses: vi.fn(),
  nodemailerCreateTransport: vi.fn(),
  nodemailerSendMail: vi.fn(),
  sql: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mocks.nodemailerCreateTransport,
  },
}));

vi.mock("@/lib/db", () => ({ sql: mocks.sql }));
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

const { getTaskReminderEmailPreview, sendTaskReminderEmails, sendTestTaskReminderEmail } = await import("@/lib/email-reminders");

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

function getSqlQueries() {
  return mocks.sql.mock.calls.map(([strings]) => (strings as TemplateStringsArray).join(" "));
}

describe("sendTaskReminderEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GMAIL_USER = "tasks@example.com";
    process.env.GMAIL_APP_PASSWORD = "test-app-password";
    delete process.env.REMINDER_EMAIL_FROM;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mocks.nodemailerCreateTransport.mockReturnValue({ sendMail: mocks.nodemailerSendMail });
    mocks.getStoredHouseUsers.mockResolvedValue([user()]);
    mocks.getStoredTaskStatuses.mockResolvedValue({});
    mocks.nodemailerSendMail.mockResolvedValue({});
    mocks.sql.mockImplementation((strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join(" ");

      if (query.includes("insert into task_email_notifications")) {
        return Promise.resolve([{ id: values[0] }]);
      }

      return Promise.resolve([]);
    });
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
    expect(mocks.nodemailerCreateTransport).toHaveBeenCalledWith({
      service: "Gmail",
      auth: {
        user: "tasks@example.com",
        pass: "test-app-password",
      },
    });
    expect(mocks.nodemailerSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "540A Tasks <tasks@example.com>",
        to: "jordi@example.com",
        subject: "You have one task today at 540A",
        text: expect.stringContaining("Take trash out"),
      }),
    );
    expect(mocks.nodemailerSendMail.mock.calls[0][0].text).not.toContain("Already done");
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
    expect(mocks.nodemailerSendMail).not.toHaveBeenCalled();
  });

  it("returns a warning without loading tasks when the email provider is not configured", async () => {
    delete process.env.GMAIL_USER;

    await expect(sendTaskReminderEmails("morning")).resolves.toEqual({
      sent: 0,
      skipped: 0,
      warnings: ["GMAIL_USER and GMAIL_APP_PASSWORD must be configured."],
    });
    expect(mocks.getStoredCalendarTasks).not.toHaveBeenCalled();
  });

  it("continues sending later eligible users when one recipient fails", async () => {
    mocks.getStoredHouseUsers.mockResolvedValue([
      user({ id: "jordi", email: "jordi@example.com" }),
      user({ id: "maria", name: "Maria", email: "maria@example.com" }),
    ]);
    mocks.getStoredCalendarTasks.mockResolvedValue({
      tasks: [
        task({ id: "task-jordi", assignedUserIds: ["jordi"], title: "Take trash out" }),
        task({ id: "task-maria", assignedUserIds: ["maria"], title: "Clean bathroom" }),
      ],
      warnings: [],
    });
    mocks.nodemailerSendMail.mockRejectedValueOnce(new Error("SMTP rejected recipient")).mockResolvedValueOnce({});

    const result = await sendTaskReminderEmails("morning");

    expect(result).toEqual({
      sent: 1,
      skipped: 1,
      warnings: ["Failed to send morning reminder to jordi@example.com: SMTP rejected recipient"],
    });
    expect(mocks.nodemailerSendMail).toHaveBeenCalledTimes(2);
    expect(mocks.nodemailerSendMail.mock.calls[1][0]).toEqual(
      expect.objectContaining({ to: "maria@example.com" }),
    );
  });

  it("treats SMTP send failures as failed sends", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task()], warnings: [] });
    mocks.nodemailerSendMail.mockRejectedValue(new Error("Invalid login"));

    const result = await sendTaskReminderEmails("morning");

    expect(result).toEqual({
      sent: 0,
      skipped: 1,
      warnings: ["Failed to send morning reminder to jordi@example.com: Invalid login"],
    });
    expect(getSqlQueries()).toContainEqual(expect.stringContaining("delivery_status = 'failed'"));
    expect(getSqlQueries()).not.toContainEqual(expect.stringContaining("delivery_status = 'sent',"));
  });

  it("escapes task titles in reminder email HTML", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({
      tasks: [task({ title: '<img src=x onerror="alert(1)"> & Trash' })],
      warnings: [],
    });

    await sendTaskReminderEmails("morning");

    const html = mocks.nodemailerSendMail.mock.calls[0][0].html;

    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; Trash");
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
  });

  it("allows stale sending reservations to be claimed for retry", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task()], warnings: [] });

    await sendTaskReminderEmails("morning");

    expect(getSqlQueries()).toContainEqual(expect.stringContaining("delivery_status = 'sent'"));
    expect(getSqlQueries()).toContainEqual(expect.stringContaining("delivery_status = 'sending'"));
    expect(getSqlQueries()).toContainEqual(expect.stringContaining("attempted_at < now()"));
  });

  it("uses the notification reservation to avoid duplicate concurrent sends", async () => {
    let reservationAttempts = 0;
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task()], warnings: [] });
    mocks.sql.mockImplementation((strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.join(" ");

      if (query.includes("insert into task_email_notifications")) {
        reservationAttempts += 1;

        return Promise.resolve(reservationAttempts === 1 ? [{ id: values[0] }] : []);
      }

      return Promise.resolve([]);
    });

    const [firstResult, secondResult] = await Promise.all([
      sendTaskReminderEmails("morning"),
      sendTaskReminderEmails("morning"),
    ]);

    expect(firstResult.sent + secondResult.sent).toBe(1);
    expect(firstResult.skipped + secondResult.skipped).toBe(1);
    expect(mocks.nodemailerSendMail).toHaveBeenCalledTimes(1);
  });

  it("renders a preview without reserving or marking notification delivery", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task({ title: "Clean kitchen" })], warnings: [] });

    const preview = await getTaskReminderEmailPreview({ type: "morning", userId: "jordi" });

    expect(preview).toEqual(
      expect.objectContaining({
        dateKey: "2026-07-15",
        subject: "You have one task today at 540A",
        taskCount: 1,
        type: "morning",
      }),
    );
    expect(preview.html).toContain("Clean kitchen");
    expect(preview.text).toContain("Clean kitchen");
    expect(getSqlQueries()).not.toContainEqual(expect.stringContaining("task_email_notifications"));
    expect(mocks.nodemailerSendMail).not.toHaveBeenCalled();
  });

  it("sends test reminders through Gmail SMTP without touching duplicate tracking", async () => {
    mocks.getStoredCalendarTasks.mockResolvedValue({ tasks: [task({ title: "Clean kitchen" })], warnings: [] });

    const result = await sendTestTaskReminderEmail({
      recipientEmail: "preview@example.com",
      type: "evening",
      userId: "jordi",
    });

    expect(result.sent).toBe(true);
    expect(mocks.nodemailerSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "preview@example.com",
        subject: "[Test] One task is still pending at 540A",
        html: expect.stringContaining("Clean kitchen"),
      }),
    );
    expect(getSqlQueries()).not.toContainEqual(expect.stringContaining("task_email_notifications"));
  });
});
