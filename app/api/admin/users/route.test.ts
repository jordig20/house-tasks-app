import { beforeEach, describe, expect, it, vi } from "vitest";

const users = [
  { id: "admin", name: "Admin", role: "admin", pin: "1111", color: "slate", email: "admin@example.com", emailRemindersEnabled: true, eveningRemindersEnabled: true },
  { id: "member-a", name: "Member A", role: "member", pin: "2222", color: "cyan", email: "member-a@example.com", emailRemindersEnabled: true, eveningRemindersEnabled: false },
];

const getStoredHouseUsers = vi.fn(async () => users);
const deactivateStoredUser = vi.fn(async (userId: string) => users.filter((user) => user.id !== userId));

vi.mock("@/lib/user-store", () => ({ deactivateStoredUser, getStoredHouseUsers }));

describe("admin users route", () => {
  beforeEach(() => getStoredHouseUsers.mockClear());
  beforeEach(() => deactivateStoredUser.mockClear());

  function request(userId: string, actorPin?: string) {
    return new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "x-house-user-id": userId },
      body: JSON.stringify({ actorPin }),
    });
  }

  function deleteRequest(body: object, userId = "admin") {
    return new Request("http://localhost/api/admin/users", {
      method: "DELETE",
      headers: { "x-house-user-id": userId },
      body: JSON.stringify(body),
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

  it("rejects user removal without valid admin PIN proof", async () => {
    const { DELETE } = await import("./route");

    await expect(DELETE(deleteRequest({ userId: "member-a" }))).resolves.toHaveProperty("status", 401);
    await expect(DELETE(deleteRequest({ userId: "member-a", actorPin: "9999" }))).resolves.toHaveProperty("status", 403);
    await expect(DELETE(deleteRequest({ userId: "member-a", actorPin: "2222" }, "member-a"))).resolves.toHaveProperty("status", 403);
    expect(deactivateStoredUser).not.toHaveBeenCalled();
  });

  it("deactivates a member and returns the sanitized active admin user list", async () => {
    const { DELETE } = await import("./route");

    const response = await DELETE(deleteRequest({ userId: "member-a", actorPin: "1111" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deactivateStoredUser).toHaveBeenCalledWith("member-a");
    expect(body.users).toEqual([
      expect.objectContaining({ id: "admin", name: "Admin", role: "admin" }),
    ]);
    expect(body.users).not.toContainEqual(expect.objectContaining({ id: "member-a" }));
    expect(JSON.stringify(body)).not.toContain("pin");
  });

  it("rejects missing, unknown, and admin deletion targets", async () => {
    const { DELETE } = await import("./route");

    const missing = await DELETE(deleteRequest({ actorPin: "1111" }));
    const unknown = await DELETE(deleteRequest({ actorPin: "1111", userId: "missing" }));
    const admin = await DELETE(deleteRequest({ actorPin: "1111", userId: "admin" }));

    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({ message: "User is required." });
    expect(unknown.status).toBe(404);
    await expect(unknown.json()).resolves.toEqual({ message: "User not found." });
    expect(admin.status).toBe(403);
    await expect(admin.json()).resolves.toEqual({ message: "Admin users cannot be removed." });
    expect(deactivateStoredUser).not.toHaveBeenCalled();
  });
});
