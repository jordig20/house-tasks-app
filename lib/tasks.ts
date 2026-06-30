export type UserRole = "admin" | "member";

export type HouseUser = {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
};

export type TaskStatus = "pending" | "done" | "skipped";

export type CleaningTask = {
  id: string;
  googleEventId: string;
  calendarName: string;
  calendarId: string;
  sourceTitle: string;
  taskTitle: string;
  title: string;
  assignedTo: string[];
  start: string;
  end: string;
  date: string;
  isAllDay: boolean;
  dueLabel: string;
  dateLabel: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  status: TaskStatus;
  durationMinutes: number;
};

export const mockUsers: HouseUser[] = [
  { id: "jordi", name: "Jordi", role: "admin", pin: "1234" },
  { id: "rafa", name: "Rafa", role: "member", pin: "1111" },
  { id: "alex", name: "Alex", role: "member", pin: "2222" },
];

export function parseCalendarTaskTitle(eventTitle: string) {
  const [peoplePart, ...taskParts] = eventTitle.split(" - ");

  if (taskParts.length === 0) {
    return {
      assignedTo: [],
      taskTitle: eventTitle.trim(),
    };
  }

  return {
    assignedTo: peoplePart.split("&").map((person) => person.trim()).filter(Boolean),
    taskTitle: taskParts.join(" - ").trim(),
  };
}

function createMockCalendarTask({
  id,
  googleEventId,
  calendarName = "mock",
  calendarId = "mock-calendar",
  sourceTitle,
  start,
  end,
  dueLabel,
  dateLabel,
  day,
  durationMinutes,
  isAllDay = false,
  status = "pending",
}: {
  id: string;
  googleEventId?: string;
  calendarName?: string;
  calendarId?: string;
  sourceTitle: string;
  start: string;
  end: string;
  dueLabel: string;
  dateLabel: string;
  day: CleaningTask["day"];
  durationMinutes: number;
  isAllDay?: boolean;
  status?: TaskStatus;
}): CleaningTask {
  const parsedTitle = parseCalendarTaskTitle(sourceTitle);

  return {
    id,
    googleEventId: googleEventId ?? id,
    calendarName,
    calendarId,
    sourceTitle,
    taskTitle: parsedTitle.taskTitle,
    title: parsedTitle.taskTitle,
    assignedTo: parsedTitle.assignedTo,
    start,
    end,
    date: start.slice(0, 10),
    isAllDay,
    dueLabel,
    dateLabel,
    day,
    status,
    durationMinutes,
  };
}

export const mockTasks: CleaningTask[] = [
  createMockCalendarTask({
    id: "week-nico-trash-recycling",
    sourceTitle: "Nico - Trash & Recycling",
    start: "2026-06-29",
    end: "2026-07-06",
    dueLabel: "All week",
    dateLabel: "Monday, Jun 29 – Sunday, Jul 5",
    day: "Monday",
    durationMinutes: 0,
    isAllDay: true,
  }),
  createMockCalendarTask({
    id: "mon-rafaela-jordi-bathroom",
    sourceTitle: "Rafaela & Jordi - Bathroom",
    start: "2026-06-29T20:30:00.000-06:00",
    end: "2026-06-29T21:00:00.000-06:00",
    dueLabel: "Today, 8:30 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "mon-michelle-zora-bathroom",
    sourceTitle: "Michelle & Zora - Bathroom",
    start: "2026-06-29T21:00:00.000-06:00",
    end: "2026-06-29T21:30:00.000-06:00",
    dueLabel: "Today, 9:00 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "tue-ellie-tilder-bathroom-cl",
    sourceTitle: "Ellie & Tilder - Bathroom Cl",
    start: "2026-06-30T19:00:00.000-06:00",
    end: "2026-06-30T19:30:00.000-06:00",
    dueLabel: "Tuesday, 7:00 PM",
    dateLabel: "Tuesday, Jun 30",
    day: "Tuesday",
    durationMinutes: 20,
  }),
  createMockCalendarTask({
    id: "wed-nico-bathroom-downstair",
    sourceTitle: "Nico - Bathroom Downstair",
    start: "2026-07-01T20:00:00.000-06:00",
    end: "2026-07-01T20:30:00.000-06:00",
    dueLabel: "Wednesday, 8:00 PM",
    dateLabel: "Wednesday, Jul 1",
    day: "Wednesday",
    durationMinutes: 20,
  }),
  createMockCalendarTask({
    id: "fri-jordi-kitchen",
    sourceTitle: "Jordi - Kitchen",
    start: "2026-07-03T18:30:00.000-06:00",
    end: "2026-07-03T19:00:00.000-06:00",
    dueLabel: "Friday, 6:30 PM",
    dateLabel: "Friday, Jul 3",
    day: "Friday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "sun-rafaela-supplies-reset",
    sourceTitle: "Rafaela - Supplies Reset",
    start: "2026-07-05T11:00:00.000-06:00",
    end: "2026-07-05T11:30:00.000-06:00",
    dueLabel: "Sunday, 11:00 AM",
    dateLabel: "Sunday, Jul 5",
    day: "Sunday",
    durationMinutes: 15,
  }),
];

export const recentHistory: CleaningTask[] = [
  createMockCalendarTask({
    id: "history-bathroom-floor",
    sourceTitle: "Alex - Bathroom Floor",
    start: "2026-06-28T19:15:00.000-06:00",
    end: "2026-06-28T19:45:00.000-06:00",
    dueLabel: "Yesterday, 7:15 PM",
    dateLabel: "Sunday, Jun 28",
    day: "Sunday",
    status: "done",
    durationMinutes: 12,
  }),
  createMockCalendarTask({
    id: "history-dishes-reset",
    sourceTitle: "Jordi - Dishwasher Reset",
    start: "2026-06-27T10:00:00.000-06:00",
    end: "2026-06-27T10:30:00.000-06:00",
    dueLabel: "Last Saturday, 10:00 AM",
    dateLabel: "Saturday, Jun 27",
    day: "Saturday",
    status: "skipped",
    durationMinutes: 10,
  }),
];

export const storageKeys = {
  currentUser: "540aCleaning.currentUser",
  taskStatuses: "540aCleaning.taskStatuses",
  users: "540aCleaning.users",
} as const;

function parseTaskBoundary(value: string, isAllDay: boolean) {
  return new Date(isAllDay && !value.includes("T") ? `${value}T00:00:00` : value);
}

function formatTaskBoundary(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function getTaskStartDate(task: Pick<CleaningTask, "start" | "isAllDay">) {
  return parseTaskBoundary(task.start, task.isAllDay);
}

export function getTaskEndDate(task: Pick<CleaningTask, "end" | "isAllDay">) {
  return parseTaskBoundary(task.end, task.isAllDay);
}

export function getDisplayEndDate(task: Pick<CleaningTask, "end" | "isAllDay">) {
  const endDate = getTaskEndDate(task);

  if (task.isAllDay) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return endDate;
}

export function isMultiDayTask(task: Pick<CleaningTask, "start" | "end" | "isAllDay">) {
  return getDisplayEndDate(task).toDateString() !== getTaskStartDate(task).toDateString();
}

export function getTaskDateRangeLabel(task: Pick<CleaningTask, "start" | "end" | "isAllDay" | "dateLabel">) {
  if (!isMultiDayTask(task)) {
    return task.dateLabel;
  }

  return `${formatTaskBoundary(getTaskStartDate(task))} – ${formatTaskBoundary(getDisplayEndDate(task))}`;
}

export function taskOverlapsRange(task: Pick<CleaningTask, "start" | "end" | "isAllDay">, start: Date, end: Date) {
  return getTaskStartDate(task) < end && getTaskEndDate(task) > start;
}

export function getTodayTasks() {
  const { start, end } = (() => {
    const todayStart = new Date("2026-06-29T00:00:00.000-06:00");
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return { start: todayStart, end: todayEnd };
  })();

  return mockTasks.filter((task) => taskOverlapsRange(task, start, end));
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
