export type UserRole = "admin" | "member";

export type HouseUser = {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  color?: string;
  email?: string;
  emailRemindersEnabled?: boolean;
  eveningRemindersEnabled?: boolean;
};

export type TaskStatus = "pending" | "done" | "skipped";
export type TaskKind = "bathroom" | "trash" | "other";
export type TaskCompletionMode = "event" | "daily";

import {
  getLocalDateKey,
  getTaskCompletionKey,
  getTaskDisplayEndDate,
  isTaskMultiDay,
  parseTaskDate,
} from "@/lib/task-instances";

export { getLocalDateKey, getTaskCompletionKey, parseTaskDate };

export type CleaningTask = {
  id: string;
  googleEventId: string;
  calendarName: string;
  calendarId: string;
  sourceTitle: string;
  taskTitle: string;
  title: string;
  assignedTo: string[];
  assignedUserIds: string[];
  taskKind: TaskKind;
  completionMode: TaskCompletionMode;
  start: string;
  end: string;
  date: string;
  isAllDay: boolean;
  dueLabel: string;
  dateLabel: string;
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  status: TaskStatus;
  durationMinutes: number;
};

export const adminUser: HouseUser = {
  id: "admin",
  name: "Admin",
  role: "admin",
  pin: "1234",
};

export function getUserIdFromName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "member"
  );
}

export function getTaskKind(taskTitle: string): TaskKind {
  const normalizedTitle = taskTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    normalizedTitle.includes("bathroom") ||
    normalizedTitle.includes("bano") ||
    normalizedTitle.includes("bath")
  ) {
    return "bathroom";
  }

  if (
    normalizedTitle.includes("trash") ||
    normalizedTitle.includes("recycling")
  ) {
    return "trash";
  }

  return "other";
}

export function parseCalendarTaskTitle(eventTitle: string) {
  const separatorMatch = eventTitle.match(/\s[-–—]\s/);

  if (!separatorMatch || separatorMatch.index === undefined) {
    const taskTitle = eventTitle.trim();

    return {
      assignedTo: [],
      assignedUserIds: [],
      taskTitle,
      taskKind: getTaskKind(taskTitle),
    };
  }

  const peoplePart = eventTitle.slice(0, separatorMatch.index);
  const taskTitle = eventTitle
    .slice(separatorMatch.index + separatorMatch[0].length)
    .trim();
  const assignedTo = peoplePart
    .split("&")
    .map((person) => person.trim())
    .filter(Boolean);

  return {
    assignedTo,
    assignedUserIds: assignedTo.map(getUserIdFromName),
    taskTitle,
    taskKind: getTaskKind(taskTitle),
  };
}

export const storageKeys = {
  currentUser: "540aCleaning.currentUser",
  taskStatuses: "540aCleaning.taskStatuses",
  users: "540aCleaning.users",
} as const;

const taskDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function isMultiDayTask(task: CleaningTask) {
  return isTaskMultiDay(task);
}

export function getTaskCompletionMode(task: Pick<CleaningTask, "taskKind">) {
  return task.taskKind === "trash" ? "daily" : "event";
}

export function getTaskDateRangeLabel(task: CleaningTask) {
  if (!isMultiDayTask(task)) {
    return task.dateLabel;
  }

  const startDate = parseTaskDate(task.start);
  const endDate = getTaskDisplayEndDate(task);

  return `${taskDateFormatter.format(startDate)} - ${taskDateFormatter.format(endDate)}`;
}

export function groupTasksByDay(tasks: CleaningTask[]) {
  return tasks.reduce<Record<CleaningTask["day"], CleaningTask[]>>(
    (groups, task) => {
      groups[task.day].push(task);
      return groups;
    },
    {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    },
  );
}
