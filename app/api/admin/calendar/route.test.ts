import { beforeEach, describe, expect, it, vi } from "vitest";

const users = [
  { id: "admin", name: "Admin", role: "admin", pin: "1111", color: "brown" },
  { id: "taylor", name: "Taylor", role: "member", pin: "2222", color: "teal" },
];
const getStoredHouseUsers = vi.fn(async () => users);
const getCalendarTasks = vi.fn(async (start: Date, end: Date) => {
  void start;
  void end;

  return {
    tasks: [{ id: "task-1", title: "Trash" }],
    warnings: ["One calendar could not be loaded."],
    isConfiguredFallback: false,
  };
});

vi.mock("@/lib/user-store", () => ({ getStoredHouseUsers }));
vi.mock("@/lib/google-calendar", () => ({ getCalendarTasks }));

describe("admin printable calendar route", () => {
  beforeEach(() => vi.clearAllMocks());

  function request(body: object, userId = "admin") {
    return new Request("http://localhost/api/admin/calendar", {
      method: "POST",
      headers: { "x-house-user-id": userId },
      body: JSON.stringify(body),
    });
  }

  it("rejects calendar reads without valid admin PIN proof", async () => {
    const { POST } = await import("./route");

    await expect(POST(request({ monthStart: "2026-08-01" }))).resolves.toHaveProperty("status", 401);
    await expect(POST(request({ actorPin: "9999", monthStart: "2026-08-01" }))).resolves.toHaveProperty("status", 403);
    await expect(POST(request({ actorPin: "2222", monthStart: "2026-08-01" }, "taylor"))).resolves.toHaveProperty("status", 403);
    expect(getCalendarTasks).not.toHaveBeenCalled();
  });

  it("validates the requested month before reading Google Calendar", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ actorPin: "1111", monthStart: "August" }));

    expect(response.status).toBe(400);
    expect(getCalendarTasks).not.toHaveBeenCalled();
  });

  it("returns tasks and public assignee colors after admin PIN proof", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ actorPin: "1111", monthStart: "2026-08-01" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getCalendarTasks).toHaveBeenCalledOnce();
    const [start, end] = getCalendarTasks.mock.calls[0];
    expect(start.toISOString()).toBe("2026-07-26T06:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-06T06:00:00.000Z");
    expect(body.users).toContainEqual({ id: "taylor", name: "Taylor", role: "member", color: "teal" });
    expect(body.tasks).toEqual([{ id: "task-1", title: "Trash" }]);
    expect(JSON.stringify(body)).not.toContain("pin");
  });
});
