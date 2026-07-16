import { beforeEach, describe, expect, it, vi } from "vitest";

const updateStoredTaskStatus = vi.fn();

vi.mock("@/lib/task-status-store", () => ({
  getStoredTaskStatuses: vi.fn(async () => ({})),
  updateStoredTaskStatus,
}));

describe("task status route", () => {
  beforeEach(() => {
    updateStoredTaskStatus.mockReset();
  });

  it("rejects invalid status payloads", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/task-statuses", {
        method: "POST",
        body: JSON.stringify({
          completionKey: "task-1:2026-07-16",
          taskId: "task-1",
          dateKey: "2026-07-16",
          status: "archived",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Valid task status payload is required.",
    });
    expect(response.status).toBe(400);
    expect(updateStoredTaskStatus).not.toHaveBeenCalled();
  });

  it("surfaces database update failures as a visible API message", async () => {
    updateStoredTaskStatus.mockRejectedValueOnce(new Error("Database unavailable."));
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/task-statuses", {
        method: "POST",
        body: JSON.stringify({
          completionKey: "task-1:2026-07-16",
          taskId: "task-1",
          dateKey: "2026-07-16",
          status: "done",
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Database unavailable.",
    });
    expect(response.status).toBe(500);
  });
});
