import { NextResponse } from "next/server";
import {
  getTaskReminderEmailPreview,
  sendTestTaskReminderEmail,
  type EmailReminderType,
} from "@/lib/email-reminders";
import { getStoredHouseUsers } from "@/lib/user-store";

type ReminderAdminAction = "preview" | "send-test";

type ReminderAdminRequest = {
  action?: ReminderAdminAction;
  actorPin?: string;
  recipientEmail?: string;
  type?: EmailReminderType;
  userId?: string;
};

function isReminderType(value: unknown): value is EmailReminderType {
  return value === "morning" || value === "evening";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const actorUserId = request.headers.get("x-house-user-id");
    const body = (await request.json().catch(() => ({}))) as ReminderAdminRequest;

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

    if (!isReminderType(body.type) || !body.userId) {
      return NextResponse.json(
        { message: "Reminder type and user are required." },
        { status: 400 },
      );
    }

    if (body.action === "preview") {
      const preview = await getTaskReminderEmailPreview({ type: body.type, userId: body.userId });

      return NextResponse.json({ preview });
    }

    if (body.action === "send-test") {
      const recipientEmail = body.recipientEmail?.trim().toLowerCase();

      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        return NextResponse.json(
          { message: "A valid test recipient email is required." },
          { status: 400 },
        );
      }

      const result = await sendTestTaskReminderEmail({
        recipientEmail,
        type: body.type,
        userId: body.userId,
      });

      return NextResponse.json({ sent: result.sent, preview: result.preview });
    }

    return NextResponse.json(
      { message: "Reminder admin action is required." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Reminder admin request failed." },
      { status: 500 },
    );
  }
}
