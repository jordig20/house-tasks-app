import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/app/api/cron/email-reminders/auth";
import { sendTaskReminderEmails } from "@/lib/email-reminders";

export async function GET(request: Request) {
  const unauthorizedResponse = authorizeCronRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const result = await sendTaskReminderEmails("evening");

  return NextResponse.json({ type: "evening", ...result });
}
