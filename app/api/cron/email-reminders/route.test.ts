import { beforeEach, describe, expect, it, vi } from "vitest";

const sendTaskReminderEmails = vi.fn(async () => ({ sent: 1, skipped: 0, warnings: [] }));

vi.mock("@/lib/email-reminders", () => ({
  sendTaskReminderEmails,
}));

describe("email reminder cron route authorization", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    sendTaskReminderEmails.mockClear();
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("fails closed when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/cron/email-reminders"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "CRON_SECRET is not configured.",
    });
    expect(sendTaskReminderEmails).not.toHaveBeenCalled();
  });

  it("requires the configured bearer secret", async () => {
    process.env.CRON_SECRET = "secret-value";
    const { GET } = await import("./route");

    const rejected = await GET(new Request("http://localhost/api/cron/email-reminders"));
    const accepted = await GET(
      new Request("http://localhost/api/cron/email-reminders?type=evening", {
        headers: { authorization: "Bearer secret-value" },
      }),
    );

    expect(rejected.status).toBe(401);
    await expect(rejected.json()).resolves.toEqual({ message: "Unauthorized." });
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toEqual({
      type: "evening",
      sent: 1,
      skipped: 0,
      warnings: [],
    });
    expect(sendTaskReminderEmails).toHaveBeenCalledTimes(1);
    expect(sendTaskReminderEmails).toHaveBeenCalledWith("evening");
  });
});
