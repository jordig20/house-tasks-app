import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/app/api/cron/email-reminders/auth";
import { sendTaskReminderEmails } from "@/lib/email-reminders";

export async function GET(request: Request) {
  const unauthorizedResponse = authorizeCronRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const result = await sendTaskReminderEmails("morning");

  return NextResponse.json({ type: "morning", ...result });
}
