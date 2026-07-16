import "server-only";

import nodemailer from "nodemailer";
import { sql } from "@/lib/db";
import { ensureCalendarTables, getStoredCalendarTasks } from "@/lib/calendar-task-store";
import { getBanffTodayRange } from "@/lib/banff-time";
import { getStoredTaskStatuses } from "@/lib/task-status-store";
import { getStoredHouseUsers } from "@/lib/user-store";
import { getResolvedTaskStatus } from "@/lib/task-instances";
import { type CleaningTask, type HouseUser } from "@/lib/tasks";

export type EmailReminderType = "morning" | "evening";

type ReminderUser = HouseUser & { email: string };

type ReminderSendResult = {
  sent: number;
  skipped: number;
  warnings: string[];
};

const staleReservationMinutes = 30;

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://house-tasks-app.vercel.app";
}

function getFromEmail() {
  return process.env.REMINDER_EMAIL_FROM ?? (process.env.GMAIL_USER ? `540A Tasks <${process.env.GMAIL_USER}>` : undefined);
}

function getReminderSubject(type: EmailReminderType, taskCount: number) {
  if (type === "evening") {
    return taskCount === 1
      ? "One task is still pending at 540A"
      : `${taskCount} tasks are still pending at 540A`;
  }

  return taskCount === 1
    ? "You have one task today at 540A"
    : `You have ${taskCount} tasks today at 540A`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return character;
    }
  });
}

function getPendingTasksForUser({
  dateKey,
  statuses,
  tasks,
  user,
}: {
  dateKey: string;
  statuses: Record<string, string>;
  tasks: CleaningTask[];
  user: HouseUser;
}) {
  return tasks.filter(
    (task) =>
      task.assignedUserIds.includes(user.id) &&
      getResolvedTaskStatus(task, dateKey, statuses) === "pending",
  );
}

function renderTaskRows(tasks: CleaningTask[]) {
  return tasks
    .map(
      (task) => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 16px; font-weight: 800; color: #020617;">${escapeHtml(task.title)}</div>
            <div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #64748b;">${escapeHtml(task.dateLabel)} · ${task.taskKind === "trash" ? "Trash" : task.taskKind === "bathroom" ? "Bathroom" : "Task"}</div>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderReminderEmail({
  dateKey,
  tasks,
  type,
  user,
}: {
  dateKey: string;
  tasks: CleaningTask[];
  type: EmailReminderType;
  user: ReminderUser;
}) {
  const siteUrl = getSiteUrl();
  const intro =
    type === "evening"
      ? "These tasks are still pending. Please mark them when they are finished."
      : "Here is your task plan for today.";

  return `
    <!doctype html>
    <html>
      <body style="margin:0; background:#f1f5f9; font-family: Inter, Arial, sans-serif; color:#020617;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9; padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border-radius:28px; background:#ffffff; box-shadow:0 24px 80px rgba(15,23,42,0.12);">
                <tr>
                  <td style="background:#020617; padding:28px; color:#ffffff;">
                    <div style="font-size:12px; font-weight:900; letter-spacing:0.18em; text-transform:uppercase; color:#67e8f9;">540A House Tasks</div>
                    <h1 style="margin:10px 0 0; font-size:28px; line-height:1.1; font-weight:900;">${type === "evening" ? "Still pending" : "Today's tasks"}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="margin:0; font-size:17px; font-weight:800; color:#020617;">Hi ${escapeHtml(user.name)},</p>
                    <p style="margin:10px 0 0; font-size:15px; line-height:1.6; color:#475569;">${intro}</p>
                    <div style="margin-top:18px; border-radius:20px; background:#f8fafc; padding:0 18px; border:1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        ${renderTaskRows(tasks)}
                      </table>
                    </div>
                    <a href="${siteUrl}/today" style="display:inline-block; margin-top:22px; border-radius:999px; background:#020617; padding:13px 20px; color:#ffffff; font-size:14px; font-weight:900; text-decoration:none;">Open Today</a>
                    <p style="margin:22px 0 0; font-size:12px; line-height:1.5; color:#94a3b8;">Sent for ${dateKey}. You can update email reminder settings from your profile in the app.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderReminderText({ tasks, type, user }: { tasks: CleaningTask[]; type: EmailReminderType; user: ReminderUser }) {
  const intro = type === "evening" ? "These tasks are still pending:" : "Here are your tasks today:";
  const taskLines = tasks.map((task) => `- ${task.title} (${task.dateLabel})`).join("\n");

  return `Hi ${user.name},\n\n${intro}\n${taskLines}\n\nOpen Today: ${getSiteUrl()}/today`;
}

async function hasSentReminder(userId: string, dateKey: string, type: EmailReminderType) {
  if (!sql) {
    return false;
  }

  const rows = await sql`
    select id from task_email_notifications
    where id = ${`${type}:${dateKey}:${userId}`}
    and delivery_status = 'sent'
    limit 1
  `;

  return rows.length > 0;
}

async function reserveReminderSend({
  dateKey,
  taskCount,
  type,
  userId,
}: {
  dateKey: string;
  taskCount: number;
  type: EmailReminderType;
  userId: string;
}) {
  if (!sql) {
    return true;
  }

  const rows = await sql`
    insert into task_email_notifications (id, user_id, date_key, reminder_type, task_count, attempted_at, sent_at, delivery_status, last_error)
    values (${`${type}:${dateKey}:${userId}`}, ${userId}, ${dateKey}, ${type}, ${taskCount}, now(), null, 'sending', null)
    on conflict (id) do update
    set task_count = excluded.task_count,
        attempted_at = now(),
        sent_at = null,
        delivery_status = 'sending',
        last_error = null
    where task_email_notifications.delivery_status = 'failed'
       or (
        task_email_notifications.delivery_status = 'sending'
        and task_email_notifications.attempted_at < now() - (${staleReservationMinutes} * interval '1 minute')
      )
    returning id
  `;

  return rows.length > 0;
}

async function markReminderSent({
  dateKey,
  taskCount,
  type,
  userId,
}: {
  dateKey: string;
  taskCount: number;
  type: EmailReminderType;
  userId: string;
}) {
  if (!sql) {
    return;
  }

  await sql`
    update task_email_notifications
    set task_count = ${taskCount},
        sent_at = now(),
        delivery_status = 'sent',
        last_error = null
    where id = ${`${type}:${dateKey}:${userId}`}
  `;
}

async function markReminderFailed({
  dateKey,
  error,
  type,
  userId,
}: {
  dateKey: string;
  error: unknown;
  type: EmailReminderType;
  userId: string;
}) {
  if (!sql) {
    return;
  }

  const message = getErrorMessage(error);

  await sql`
    update task_email_notifications
    set delivery_status = 'failed',
        last_error = ${message}
    where id = ${`${type}:${dateKey}:${userId}`}
  `;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return String(error);
}

function getReminderSendFailureWarning(type: EmailReminderType, user: ReminderUser, error: unknown) {
  const message = getErrorMessage(error);

  return `Failed to send ${type} reminder to ${user.email}: ${message}`;
}

export async function sendTaskReminderEmails(type: EmailReminderType): Promise<ReminderSendResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const warnings: string[] = [];

  if (!gmailUser || !gmailAppPassword) {
    return { sent: 0, skipped: 0, warnings: ["GMAIL_USER and GMAIL_APP_PASSWORD must be configured."] };
  }

  await ensureCalendarTables();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
  const { start, end, dateKey } = getBanffTodayRange();
  const [calendarTasks, users, statuses] = await Promise.all([
    getStoredCalendarTasks(start, end),
    getStoredHouseUsers(),
    getStoredTaskStatuses(),
  ]);
  let sent = 0;
  let skipped = 0;

  if (calendarTasks.warnings.length > 0) {
    warnings.push(...calendarTasks.warnings);
  }

  for (const user of users) {
    if (!user.email || !user.emailRemindersEnabled) {
      skipped += 1;
      continue;
    }

    if (type === "evening" && !user.eveningRemindersEnabled) {
      skipped += 1;
      continue;
    }

    const reminderUser = user as ReminderUser;
    const tasks = getPendingTasksForUser({
      dateKey,
      statuses,
      tasks: calendarTasks.tasks,
      user,
    });

    if (tasks.length === 0 || (await hasSentReminder(user.id, dateKey, type))) {
      skipped += 1;
      continue;
    }

    if (!(await reserveReminderSend({ dateKey, taskCount: tasks.length, type, userId: user.id }))) {
      skipped += 1;
      continue;
    }

    try {
      await transporter.sendMail({
        from: getFromEmail(),
        to: reminderUser.email,
        subject: getReminderSubject(type, tasks.length),
        html: renderReminderEmail({ dateKey, tasks, type, user: reminderUser }),
        text: renderReminderText({ tasks, type, user: reminderUser }),
      });
    } catch (error) {
      warnings.push(getReminderSendFailureWarning(type, reminderUser, error));
      await markReminderFailed({ dateKey, error, type, userId: user.id });
      skipped += 1;
      continue;
    }

    await markReminderSent({
      dateKey,
      taskCount: tasks.length,
      type,
      userId: user.id,
    });
    sent += 1;
  }

  return { sent, skipped, warnings };
}
