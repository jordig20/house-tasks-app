import { beforeEach, describe, expect, it, vi } from "vitest";

const users = [
  {
    id: "admin",
    name: "Admin",
    role: "admin",
    pin: "1111",
    color: "slate",
    email: "admin@example.com",
    emailRemindersEnabled: true,
    eveningRemindersEnabled: true,
  },
  {
    id: "member-a",
    name: "Member A",
    role: "member",
    pin: "2222",
    color: "cyan",
    email: "member-a@example.com",
    emailRemindersEnabled: true,
    eveningRemindersEnabled: false,
  },
];

const getStoredHouseUsers = vi.fn(async () => users);
const updateStoredUserColor = vi.fn(async () => users);
const updateStoredUserEmail = vi.fn(async () => users);
const updateStoredUserEmailPreferences = vi.fn(async () => users);
const updateStoredUserPin = vi.fn(async () => users);

vi.mock("@/lib/user-store", () => ({
  getStoredHouseUsers,
  updateStoredUserColor,
  updateStoredUserEmail,
  updateStoredUserEmailPreferences,
  updateStoredUserPin,
}));

describe("users route public response", () => {
  beforeEach(() => {
    getStoredHouseUsers.mockClear();
    updateStoredUserColor.mockClear();
    updateStoredUserEmail.mockClear();
    updateStoredUserEmailPreferences.mockClear();
    updateStoredUserPin.mockClear();
  });

  it("returns only public user fields from GET", async () => {
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      users: [
        { id: "admin", name: "Admin", role: "admin", color: "slate" },
        { id: "member-a", name: "Member A", role: "member", color: "cyan" },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("pin");
    expect(JSON.stringify(body)).not.toContain("email");
    expect(JSON.stringify(body)).not.toContain("emailRemindersEnabled");
    expect(JSON.stringify(body)).not.toContain("eveningRemindersEnabled");
  });

  it("requires PIN proof for color updates", async () => {
    const { PATCH } = await import("./route");

    const rejected = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", color: "violet" }),
      }),
    );
    const accepted = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", color: "violet", currentPin: "2222" }),
      }),
    );

    expect(rejected.status).toBe(403);
    expect(accepted.status).toBe(200);
    expect(updateStoredUserColor).toHaveBeenCalledTimes(1);
    expect(updateStoredUserColor).toHaveBeenCalledWith("member-a", "violet");
  });

  it("requires admin PIN proof for cross-user color updates", async () => {
    const { PATCH } = await import("./route");

    const rejected = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "admin" },
        body: JSON.stringify({ userId: "member-a", color: "violet" }),
      }),
    );
    const accepted = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "admin" },
        body: JSON.stringify({ userId: "member-a", color: "violet", actorPin: "1111" }),
      }),
    );

    expect(rejected.status).toBe(403);
    expect(accepted.status).toBe(200);
    expect(updateStoredUserColor).toHaveBeenCalledTimes(1);
    expect(updateStoredUserColor).toHaveBeenCalledWith("member-a", "violet");
  });

  it("preserves existing PIN updates", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", pin: "4444", currentPin: "2222" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateStoredUserPin).toHaveBeenCalledWith("member-a", "4444");
  });

  it("requires PIN proof for sensitive email updates", async () => {
    const { PATCH } = await import("./route");

    const rejected = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", email: "new@example.com" }),
      }),
    );
    const accepted = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", email: "new@example.com", currentPin: "2222" }),
      }),
    );

    expect(rejected.status).toBe(403);
    await expect(rejected.json()).resolves.toEqual({
      message: "Current PIN is required for this update.",
    });
    expect(accepted.status).toBe(200);
    expect(updateStoredUserEmail).toHaveBeenCalledTimes(1);
    expect(updateStoredUserEmail).toHaveBeenCalledWith("member-a", "new@example.com");
  });

  it("allows admin PIN proof for sensitive cross-user preference updates", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "admin" },
        body: JSON.stringify({
          userId: "member-a",
          emailRemindersEnabled: false,
          actorPin: "1111",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateStoredUserEmailPreferences).toHaveBeenCalledWith({
      userId: "member-a",
      emailRemindersEnabled: false,
      eveningRemindersEnabled: undefined,
    });
  });

  it("applies combined email and preference updates", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({
          userId: "member-a",
          email: "New@Example.com",
          emailRemindersEnabled: false,
          eveningRemindersEnabled: true,
          currentPin: "2222",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateStoredUserEmail).toHaveBeenCalledWith("member-a", "new@example.com");
    expect(updateStoredUserEmailPreferences).toHaveBeenCalledWith({
      userId: "member-a",
      emailRemindersEnabled: false,
      eveningRemindersEnabled: true,
    });
  });
});
