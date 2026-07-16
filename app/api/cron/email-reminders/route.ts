import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/app/api/cron/email-reminders/auth";
import {
  sendTaskReminderEmails,
  type EmailReminderType,
} from "@/lib/email-reminders";

function getReminderType(request: Request): EmailReminderType {
  const url = new URL(request.url);

  return url.searchParams.get("type") === "evening" ? "evening" : "morning";
}

export async function GET(request: Request) {
  const unauthorizedResponse = authorizeCronRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const type = getReminderType(request);
  const result = await sendTaskReminderEmails(type);

  return NextResponse.json({ type, ...result });
}
