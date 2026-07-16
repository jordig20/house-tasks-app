import { NextResponse } from "next/server";
import { getStoredHouseUsers } from "@/lib/user-store";
import type { HouseUser } from "@/lib/tasks";

type AdminHouseUser = Pick<
  HouseUser,
  | "id"
  | "name"
  | "role"
  | "color"
  | "email"
  | "emailRemindersEnabled"
  | "eveningRemindersEnabled"
>;

function toAdminUsers(users: HouseUser[]): AdminHouseUser[] {
  return users.map(
    ({
      id,
      name,
      role,
      color,
      email,
      emailRemindersEnabled,
      eveningRemindersEnabled,
    }) => ({
      id,
      name,
      role,
      color,
      email,
      emailRemindersEnabled,
      eveningRemindersEnabled,
    }),
  );
}

export async function POST(request: Request) {
  const actorUserId = request.headers.get("x-house-user-id");
  const body = (await request.json().catch(() => ({}))) as { actorPin?: string };

  if (!actorUserId || !body.actorPin) {
    return NextResponse.json(
      { message: "Admin PIN proof is required." },
      { status: 401 },
    );
  }

  const users = await getStoredHouseUsers();
  const actor = users.find((user) => user.id === actorUserId);

  if (actor?.role !== "admin" || actor.pin !== body.actorPin) {
    return NextResponse.json(
      { message: "Admin PIN proof is required." },
      { status: 403 },
    );
  }

  return NextResponse.json({ users: toAdminUsers(users) });
}
