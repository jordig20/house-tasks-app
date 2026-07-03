import "server-only";

import { sql } from "@/lib/db";
import { getBanffDateKey, getBanffMonthRange } from "@/lib/banff-time";
import type { CalendarTaskResult } from "@/lib/google-calendar";
import type { CleaningTask, TaskCompletionMode, TaskKind } from "@/lib/tasks";

type CalendarTaskRow = {
  id: string;
  google_event_id: string;
  calendar_name: string;
  calendar_id: string;
  source_title: string;
  task_title: string;
  title: string;
  assigned_to: string[];
  assigned_user_ids: string[];
  task_kind: TaskKind;
  completion_mode: TaskCompletionMode;
  start_value: string;
  end_value: string;
  date_key: string;
  is_all_day: boolean;
  due_label: string;
  date_label: string;
  day_name: CleaningTask["day"];
  status: CleaningTask["status"];
  duration_minutes: number;
};

let didEnsureTables = false;

function getDateOnly(value: string) {
  return value.includes("T") ? value.slice(0, 10) : value;
}

function getPreviousDateKey(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);

  return getDateOnly(date.toISOString());
}

function getTaskVisibleEndKey(task: CleaningTask) {
  const endKey = getDateOnly(task.end);

  return task.isAllDay ? getPreviousDateKey(endKey) : endKey;
}

function getRangeKeys(start: Date, end: Date) {
  const exclusiveEnd = new Date(end);
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() - 1);

  return {
    startKey: getBanffDateKey(start),
    endKey: getBanffDateKey(exclusiveEnd),
  };
}

function rowToTask(row: CalendarTaskRow): CleaningTask {
  return {
    id: row.id,
    googleEventId: row.google_event_id,
    calendarName: row.calendar_name,
    calendarId: row.calendar_id,
    sourceTitle: row.source_title,
    taskTitle: row.task_title,
    title: row.title,
    assignedTo: row.assigned_to,
    assignedUserIds: row.assigned_user_ids,
    taskKind: row.task_kind,
    completionMode: row.completion_mode,
    start: row.start_value,
    end: row.end_value,
    date: row.date_key,
    isAllDay: row.is_all_day,
    dueLabel: row.due_label,
    dateLabel: row.date_label,
    day: row.day_name,
    status: row.status,
    durationMinutes: row.duration_minutes,
  };
}

export async function ensureCalendarTables() {
  if (!sql || didEnsureTables) {
    return;
  }

  await sql`
    create table if not exists calendar_tasks (
      id text primary key,
      google_event_id text not null,
      calendar_name text not null,
      calendar_id text not null,
      source_title text not null,
      task_title text not null,
      title text not null,
      assigned_to jsonb not null,
      assigned_user_ids jsonb not null,
      task_kind text not null,
      completion_mode text not null,
      start_value text not null,
      end_value text not null,
      date_key text not null,
      visible_end_key text not null,
      is_all_day boolean not null,
      due_label text not null,
      date_label text not null,
      day_name text not null,
      status text not null default 'pending',
      duration_minutes integer not null default 0,
      synced_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists calendar_syncs (
      id text primary key,
      synced_at timestamptz not null default now(),
      task_count integer not null default 0
    )
  `;
  await sql`
    create index if not exists calendar_tasks_date_range_idx
    on calendar_tasks (date_key, visible_end_key)
  `;

  didEnsureTables = true;
}

export async function replaceStoredCalendarTasks(tasks: CleaningTask[]) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureCalendarTables();
  await sql`delete from calendar_tasks`;

  for (const task of tasks) {
    await sql`
      insert into calendar_tasks (
        id,
        google_event_id,
        calendar_name,
        calendar_id,
        source_title,
        task_title,
        title,
        assigned_to,
        assigned_user_ids,
        task_kind,
        completion_mode,
        start_value,
        end_value,
        date_key,
        visible_end_key,
        is_all_day,
        due_label,
        date_label,
        day_name,
        status,
        duration_minutes,
        synced_at
      ) values (
        ${task.id},
        ${task.googleEventId},
        ${task.calendarName},
        ${task.calendarId},
        ${task.sourceTitle},
        ${task.taskTitle},
        ${task.title},
        ${JSON.stringify(task.assignedTo)}::jsonb,
        ${JSON.stringify(task.assignedUserIds)}::jsonb,
        ${task.taskKind},
        ${task.completionMode},
        ${task.start},
        ${task.end},
        ${task.date},
        ${getTaskVisibleEndKey(task)},
        ${task.isAllDay},
        ${task.dueLabel},
        ${task.dateLabel},
        ${task.day},
        ${task.status},
        ${task.durationMinutes},
        now()
      )
      on conflict (id) do update set
        google_event_id = excluded.google_event_id,
        calendar_name = excluded.calendar_name,
        calendar_id = excluded.calendar_id,
        source_title = excluded.source_title,
        task_title = excluded.task_title,
        title = excluded.title,
        assigned_to = excluded.assigned_to,
        assigned_user_ids = excluded.assigned_user_ids,
        task_kind = excluded.task_kind,
        completion_mode = excluded.completion_mode,
        start_value = excluded.start_value,
        end_value = excluded.end_value,
        date_key = excluded.date_key,
        visible_end_key = excluded.visible_end_key,
        is_all_day = excluded.is_all_day,
        due_label = excluded.due_label,
        date_label = excluded.date_label,
        day_name = excluded.day_name,
        status = excluded.status,
        duration_minutes = excluded.duration_minutes,
        synced_at = now()
    `;
  }

  await sql`
    insert into calendar_syncs (id, synced_at, task_count)
    values ('calendar', now(), ${tasks.length})
    on conflict (id) do update set
      synced_at = now(),
      task_count = excluded.task_count
  `;
}

export async function getStoredCalendarTasks(
  start: Date,
  end: Date,
): Promise<CalendarTaskResult> {
  if (!sql) {
    return {
      tasks: [],
      warnings: ["Neon is not configured, so synced calendar tasks cannot be loaded."],
      isConfiguredFallback: true,
    };
  }

  await ensureCalendarTables();

  const { startKey, endKey } = getRangeKeys(start, end);
  const syncRows = await sql`
    select synced_at from calendar_syncs where id = 'calendar' limit 1
  `;
  const rows = (await sql`
    select * from calendar_tasks
    where date_key <= ${endKey} and visible_end_key >= ${startKey}
    order by start_value asc
  `) as CalendarTaskRow[];
  const warnings =
    syncRows.length === 0
      ? ["Calendar has not been synced yet. Ask an admin to sync calendar."]
      : [];

  return {
    tasks: rows.map(rowToTask),
    warnings,
    isConfiguredFallback: syncRows.length === 0,
  };
}

export async function getCurrentMonthSyncRange(now = new Date()) {
  return getBanffMonthRange(now);
}
