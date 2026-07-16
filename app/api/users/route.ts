import { NextResponse } from "next/server";
import {
  getStoredHouseUsers,
  updateStoredUserColor,
  updateStoredUserEmail,
  updateStoredUserEmailPreferences,
  updateStoredUserPin,
} from "@/lib/user-store";
import type { HouseUser } from "@/lib/tasks";

type PublicHouseUser = Pick<HouseUser, "id" | "name" | "role" | "color">;

function toPublicUsers(users: HouseUser[]): PublicHouseUser[] {
  return users.map(({ id, name, role, color }) => ({ id, name, role, color }));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function canUpdateUser(actor: HouseUser | undefined, targetUserId: string) {
  return Boolean(actor && (actor.role === "admin" || actor.id === targetUserId));
}

async function authorizeUserUpdate(request: Request, targetUserId: string) {
  const actorUserId = request.headers.get("x-house-user-id");

  if (!actorUserId) {
    return { response: NextResponse.json({ message: "User authorization is required." }, { status: 401 }) };
  }

  const users = await getStoredHouseUsers();
  const actor = users.find((user) => user.id === actorUserId);

  if (!canUpdateUser(actor, targetUserId)) {
    return { response: NextResponse.json({ message: "User update is not allowed." }, { status: 403 }) };
  }

  return { actor, users };
}

function authorizeSensitiveUserUpdate({
  actor,
  actorPin,
  currentPin,
  targetUser,
}: {
  actor: HouseUser | undefined;
  actorPin?: string;
  currentPin?: string;
  targetUser: HouseUser | undefined;
}) {
  if (!targetUser) {
    return NextResponse.json({ message: "User update is not allowed." }, { status: 403 });
  }

  const hasAdminPinProof = Boolean(actor?.role === "admin" && actorPin && actor.pin === actorPin);
  const hasSelfPinProof = Boolean(currentPin && currentPin === targetUser.pin);

  if (hasAdminPinProof || hasSelfPinProof) {
    return null;
  }

  return NextResponse.json(
    { message: "Current PIN is required for this update." },
    { status: 403 },
  );
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
      email?: string;
      emailRemindersEnabled?: boolean;
      eveningRemindersEnabled?: boolean;
      currentPin?: string;
      actorPin?: string;
    };

    if (!body.userId) {
      return NextResponse.json({ message: "User is required." }, { status: 400 });
    }

    const authorization = await authorizeUserUpdate(request, body.userId);

    if (authorization.response) {
      return authorization.response;
    }

    const normalizedEmail = body.email?.trim().toLowerCase();

    if (body.email !== undefined && (!normalizedEmail || !isValidEmail(normalizedEmail))) {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 },
      );
    }

    const isSensitiveUpdate = Boolean(
      body.pin ||
        body.color ||
        normalizedEmail ||
        body.emailRemindersEnabled !== undefined ||
        body.eveningRemindersEnabled !== undefined,
    );

    if (isSensitiveUpdate) {
      const unauthorizedSensitiveResponse = authorizeSensitiveUserUpdate({
        actor: authorization.actor,
        actorPin: body.actorPin,
        currentPin: body.currentPin,
        targetUser: authorization.users?.find((user) => user.id === body.userId),
      });

      if (unauthorizedSensitiveResponse) {
        return unauthorizedSensitiveResponse;
      }
    }

    let users: HouseUser[] | null = null;

    if (body.pin) {
      users = await updateStoredUserPin(body.userId, body.pin);
    }

    if (body.color) {
      users = await updateStoredUserColor(body.userId, body.color);
    }

    if (normalizedEmail) {
      users = await updateStoredUserEmail(body.userId, normalizedEmail);
    }

    if (
      body.emailRemindersEnabled !== undefined ||
      body.eveningRemindersEnabled !== undefined
    ) {
      users = await updateStoredUserEmailPreferences({
        userId: body.userId,
        emailRemindersEnabled: body.emailRemindersEnabled,
        eveningRemindersEnabled: body.eveningRemindersEnabled,
      });
    }

    if (!users) {
      return NextResponse.json(
        { message: "PIN, color, email, or email preference is required." },
        { status: 400 },
      );
    }

    return NextResponse.json({ users: toPublicUsers(users) });
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
