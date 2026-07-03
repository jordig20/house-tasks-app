import "server-only";

import { sql } from "@/lib/db";
import { ensureCalendarTables } from "@/lib/calendar-task-store";
import type { TaskStatus } from "@/lib/tasks";

export type TaskStatusMap = Record<string, TaskStatus>;

type TaskStatusRow = {
  completion_key: string;
  status: TaskStatus;
};

export async function getStoredTaskStatuses() {
  if (!sql) {
    return {};
  }

  await ensureCalendarTables();

  const rows = (await sql`
    select completion_key, status from task_statuses
  `) as TaskStatusRow[];

  return rows.reduce<TaskStatusMap>((statuses, row) => {
    statuses[row.completion_key] = row.status;
    return statuses;
  }, {});
}

export async function updateStoredTaskStatus({
  completionKey,
  taskId,
  dateKey,
  status,
  updatedBy,
}: {
  completionKey: string;
  taskId: string;
  dateKey: string;
  status: TaskStatus;
  updatedBy?: string;
}) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`
    insert into task_statuses (
      completion_key,
      task_id,
      date_key,
      status,
      updated_by,
      updated_at
    ) values (
      ${completionKey},
      ${taskId},
      ${dateKey},
      ${status},
      ${updatedBy ?? null},
      now()
    )
    on conflict (completion_key) do update set
      status = excluded.status,
      updated_by = excluded.updated_by,
      updated_at = now()
  `;
}
