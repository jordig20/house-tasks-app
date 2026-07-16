import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRows = vi.hoisted(() => [
  {
    id: "admin",
    name: "Admin",
    role: "admin",
    pin: "1111",
    color: null,
    email: "admin@example.com",
    email_reminders_enabled: true,
    evening_reminders_enabled: false,
  },
  {
    id: "member-a",
    name: "Member A",
    role: "member",
    pin: "0000",
    color: "cyan",
    email: null,
    email_reminders_enabled: false,
    evening_reminders_enabled: true,
  },
]);

const sql = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray) => {
    const statement = strings.join(" ");

    if (statement.includes("select id, name, role, pin, color, email")) {
      return mockRows;
    }

    return [];
  }),
);

const ensureCalendarTables = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/db", () => ({ sql }));
vi.mock("@/lib/calendar-task-store", () => ({ ensureCalendarTables }));

describe("user storage mapping", () => {
  beforeEach(() => {
    sql.mockClear();
    ensureCalendarTables.mockClear();
  });

  it("maps optional email and reminder preference columns onto stored users", async () => {
    const { getStoredHouseUsers } = await import("./user-store");

    const users = await getStoredHouseUsers();

    expect(users).toEqual([
      {
        id: "admin",
        name: "Admin",
        role: "admin",
        pin: "1111",
        color: undefined,
        email: "admin@example.com",
        emailRemindersEnabled: true,
        eveningRemindersEnabled: false,
      },
      {
        id: "member-a",
        name: "Member A",
        role: "member",
        pin: "0000",
        color: "cyan",
        email: undefined,
        emailRemindersEnabled: false,
        eveningRemindersEnabled: true,
      },
    ]);
    expect(ensureCalendarTables).toHaveBeenCalledOnce();
  });

  it("keeps login storage fields private while returning reminder setup state", async () => {
    const { validateStoredLogin } = await import("./user-store");

    const loggedInUser = await validateStoredLogin("member-a", "0000");

    expect(loggedInUser).toEqual({
      id: "member-a",
      name: "Member A",
      role: "member",
      color: "cyan",
      email: undefined,
      emailRemindersEnabled: false,
      eveningRemindersEnabled: true,
      mustChangePin: true,
      mustAddEmail: true,
    });
    expect(loggedInUser).not.toHaveProperty("pin");
  });
});
