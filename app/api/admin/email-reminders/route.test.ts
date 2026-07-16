import { beforeEach, describe, expect, it, vi } from "vitest";

const users = [
  { id: "admin", name: "Admin", role: "admin", pin: "1111", color: "slate" },
  { id: "member-a", name: "Member A", role: "member", pin: "2222", color: "cyan", email: "member-a@example.com" },
];

const getStoredHouseUsers = vi.fn(async () => users);
const preview = {
  dateKey: "2026-07-15",
  html: "<strong>Reminder</strong>",
  subject: "You have one task today at 540A",
  taskCount: 1,
  text: "Reminder",
  type: "morning",
  user: { id: "member-a", name: "Member A", email: "member-a@example.com" },
};
const getTaskReminderEmailPreview = vi.fn(async () => preview);
const sendTestTaskReminderEmail = vi.fn(async () => ({ sent: true, preview }));

vi.mock("@/lib/user-store", () => ({ getStoredHouseUsers }));
vi.mock("@/lib/email-reminders", () => ({
  getTaskReminderEmailPreview,
  sendTestTaskReminderEmail,
}));

describe("admin email reminders route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function request(body: object, userId = "admin") {
    return new Request("http://localhost/api/admin/email-reminders", {
      method: "POST",
      headers: { "x-house-user-id": userId },
      body: JSON.stringify(body),
    });
  }

  it("requires valid admin PIN proof before returning preview content or sending tests", async () => {
    const { POST } = await import("./route");

    await expect(POST(request({ action: "preview", type: "morning", userId: "member-a" }))).resolves.toHaveProperty("status", 401);
    await expect(POST(request({ action: "preview", actorPin: "9999", type: "morning", userId: "member-a" }))).resolves.toHaveProperty("status", 403);
    await expect(POST(request({ action: "preview", actorPin: "2222", type: "morning", userId: "member-a" }, "member-a"))).resolves.toHaveProperty("status", 403);
    expect(getTaskReminderEmailPreview).not.toHaveBeenCalled();
    expect(sendTestTaskReminderEmail).not.toHaveBeenCalled();
  });

  it("returns preview content after admin PIN proof without PINs", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ action: "preview", actorPin: "1111", type: "morning", userId: "member-a" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preview).toEqual(expect.objectContaining({ html: "<strong>Reminder</strong>" }));
    expect(getTaskReminderEmailPreview).toHaveBeenCalledWith({ type: "morning", userId: "member-a" });
    expect(JSON.stringify(body)).not.toContain("pin");
  });

  it("validates and sends test reminders after admin PIN proof", async () => {
    const { POST } = await import("./route");

    await expect(POST(request({
      action: "send-test",
      actorPin: "1111",
      recipientEmail: "not-an-email",
      type: "evening",
      userId: "member-a",
    }))).resolves.toHaveProperty("status", 400);

    const response = await POST(request({
      action: "send-test",
      actorPin: "1111",
      recipientEmail: "TEST@Example.com",
      type: "evening",
      userId: "member-a",
    }));

    expect(response.status).toBe(200);
    expect(sendTestTaskReminderEmail).toHaveBeenCalledWith({
      recipientEmail: "test@example.com",
      type: "evening",
      userId: "member-a",
    });
  });
});
