export type UserRole = "admin" | "member";

export type HouseUser = {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  color?: string;
};

export type TaskStatus = "pending" | "done" | "skipped";
export type TaskKind = "bathroom" | "trash" | "other";
export type TaskCompletionMode = "event" | "daily";

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

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseTaskDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

function getDisplayEndDate(task: CleaningTask) {
  const endDate = parseTaskDate(task.end);

  if (task.isAllDay) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return endDate;
}

export function isMultiDayTask(task: CleaningTask) {
  const startDate = parseTaskDate(task.start);
  const endDate = getDisplayEndDate(task);

  return startDate.toDateString() !== endDate.toDateString();
}

export function getTaskCompletionMode(task: Pick<CleaningTask, "taskKind">) {
  return task.taskKind === "trash" ? "daily" : "event";
}

export function getTaskCompletionKey(task: CleaningTask, date = task.date) {
  if (task.completionMode === "daily") {
    return `daily:${task.id}:${date}`;
  }

  return `event:${task.id}`;
}

export function getTaskDateRangeLabel(task: CleaningTask) {
  if (!isMultiDayTask(task)) {
    return task.dateLabel;
  }

  const startDate = parseTaskDate(task.start);
  const endDate = getDisplayEndDate(task);

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
