import { beforeEach, describe, expect, it, vi } from "vitest";

const users = [
  { id: "admin", name: "Admin", role: "admin", pin: "1111", color: "slate", email: "admin@example.com", emailRemindersEnabled: true, eveningRemindersEnabled: true },
  { id: "member-a", name: "Member A", role: "member", pin: "2222", color: "cyan", email: "member-a@example.com", emailRemindersEnabled: true, eveningRemindersEnabled: false },
];

const getStoredHouseUsers = vi.fn(async () => users);

vi.mock("@/lib/user-store", () => ({ getStoredHouseUsers }));

describe("admin users route", () => {
  beforeEach(() => getStoredHouseUsers.mockClear());

  function request(userId: string, actorPin?: string) {
    return new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "x-house-user-id": userId },
      body: JSON.stringify({ actorPin }),
    });
  }

  it("returns email reminder fields without PINs after admin PIN proof", async () => {
    const { POST } = await import("./route");

    const response = await POST(request("admin", "1111"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toContainEqual(
      expect.objectContaining({
        id: "member-a",
        email: "member-a@example.com",
        emailRemindersEnabled: true,
        eveningRemindersEnabled: false,
      }),
    );
    expect(JSON.stringify(body)).not.toContain("pin");
  });

  it("rejects spoofed admin reads without valid admin PIN proof", async () => {
    const { POST } = await import("./route");

    await expect(POST(request("admin"))).resolves.toHaveProperty("status", 401);
    await expect(POST(request("admin", "9999"))).resolves.toHaveProperty("status", 403);
    await expect(POST(request("member-a", "2222"))).resolves.toHaveProperty("status", 403);
  });
});
