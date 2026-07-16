import "server-only";

import { sql } from "@/lib/db";
import { ensureCalendarTables } from "@/lib/calendar-task-store";
import { adminUser, type HouseUser } from "@/lib/tasks";
import { defaultMemberPin } from "@/lib/users";

type HouseUserRow = {
  id: string;
  name: string;
  role: HouseUser["role"];
  pin: string;
  color: string | null;
  email: string | null;
  email_reminders_enabled: boolean;
  evening_reminders_enabled: boolean;
};

function rowToUser(row: HouseUserRow): HouseUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    pin: row.pin,
    color: row.color ?? undefined,
    email: row.email ?? undefined,
    emailRemindersEnabled: row.email_reminders_enabled,
    eveningRemindersEnabled: row.evening_reminders_enabled,
  };
}

export async function getStoredHouseUsers() {
  if (!sql) {
    return [];
  }

  await ensureCalendarTables();
  await sql`
    insert into house_users (id, name, normalized_name, role, pin, color, source)
    values (
      ${adminUser.id},
      ${adminUser.name},
      ${adminUser.name.toLowerCase()},
      ${adminUser.role},
      ${adminUser.pin},
      ${null},
      'manual'
    )
    on conflict do nothing
  `;

  const rows = (await sql`
    select id, name, role, pin, color, email, email_reminders_enabled, evening_reminders_enabled
    from house_users
    where is_active = true
    order by case when role = 'admin' then 0 else 1 end, name asc
  `) as HouseUserRow[];

  return rows.map(rowToUser);
}

export async function validateStoredLogin(userId: string, pin: string) {
  const users = await getStoredHouseUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user || user.pin !== pin) {
    return null;
  }

  const loggedInUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
    email: user.email,
    emailRemindersEnabled: user.emailRemindersEnabled,
    eveningRemindersEnabled: user.eveningRemindersEnabled,
    mustChangePin: user.pin === defaultMemberPin,
    mustAddEmail: !user.email,
  };

  return loggedInUser;
}

export async function updateStoredUserPin(userId: string, pin: string) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`
    update house_users
    set pin = ${pin}, updated_at = now()
    where id = ${userId}
  `;

  return getStoredHouseUsers();
}

export async function updateStoredUserColor(userId: string, color: string) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`
    update house_users
    set color = ${color}, updated_at = now()
    where id = ${userId}
  `;

  return getStoredHouseUsers();
}

export async function updateStoredUserEmail(userId: string, email: string) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`
    update house_users
    set email = ${email}, updated_at = now()
    where id = ${userId}
  `;

  return getStoredHouseUsers();
}

export async function updateStoredUserEmailPreferences({
  userId,
  emailRemindersEnabled,
  eveningRemindersEnabled,
}: {
  userId: string;
  emailRemindersEnabled?: boolean;
  eveningRemindersEnabled?: boolean;
}) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`
    update house_users
    set
      email_reminders_enabled = coalesce(${emailRemindersEnabled ?? null}, email_reminders_enabled),
      evening_reminders_enabled = coalesce(${eveningRemindersEnabled ?? null}, evening_reminders_enabled),
      updated_at = now()
    where id = ${userId}
  `;

  return getStoredHouseUsers();
}
