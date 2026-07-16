import { NextResponse } from "next/server";
import {
  getStoredHouseUsers,
  updateStoredUserColor,
  updateStoredUserPin,
} from "@/lib/user-store";
import type { HouseUser } from "@/lib/tasks";

type PublicHouseUser = Pick<HouseUser, "id" | "name" | "role" | "color">;

function toPublicUsers(users: HouseUser[]): PublicHouseUser[] {
  return users.map(({ id, name, role, color }) => ({ id, name, role, color }));
}

export async function GET() {
  const users = await getStoredHouseUsers();

  return NextResponse.json({ users: toPublicUsers(users) });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      pin?: string;
      color?: string;
    };

    if (!body.userId) {
      return NextResponse.json({ message: "User is required." }, { status: 400 });
    }

    const users = body.pin
      ? await updateStoredUserPin(body.userId, body.pin)
      : body.color
        ? await updateStoredUserColor(body.userId, body.color)
        : null;

    if (!users) {
      return NextResponse.json(
        { message: "PIN or color is required." },
        { status: 400 },
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "User update failed.",
      },
      { status: 500 },
    );
  }
}
