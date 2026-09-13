import { NextResponse } from "next/server";
import { deactivateStoredUser, getStoredHouseUsers } from "@/lib/user-store";
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

export async function DELETE(request: Request) {
  try {
    const actorUserId = request.headers.get("x-house-user-id");
    const body = (await request.json().catch(() => ({}))) as {
      actorPin?: string;
      userId?: string;
    };

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

    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json(
        { message: "User is required." },
        { status: 400 },
      );
    }

    const target = users.find((user) => user.id === body.userId);

    if (!target) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { message: "Admin users cannot be removed." },
        { status: 403 },
      );
    }

    const activeUsers = await deactivateStoredUser(body.userId);

    return NextResponse.json({ users: toAdminUsers(activeUsers) });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "User removal failed.",
      },
      { status: 500 },
    );
  }
}
