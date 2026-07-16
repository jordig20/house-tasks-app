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
const updateStoredUserPin = vi.fn(async () => users);

vi.mock("@/lib/user-store", () => ({
  getStoredHouseUsers,
  updateStoredUserColor,
  updateStoredUserEmail: vi.fn(async () => users),
  updateStoredUserEmailPreferences: vi.fn(async () => users),
  updateStoredUserPin,
}));

describe("users route public response", () => {
  beforeEach(() => {
    getStoredHouseUsers.mockClear();
    updateStoredUserColor.mockClear();
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

  it("preserves existing color updates", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/users", {
        method: "PATCH",
        headers: { "x-house-user-id": "member-a" },
        body: JSON.stringify({ userId: "member-a", color: "violet" }),
      }),
    );

    expect(response.status).toBe(200);
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
});
