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
    id: "mon-nico-trash-recycling",
    sourceTitle: "Nico - Trash & Recycling",
    start: "2026-06-29T20:00:00.000-06:00",
    end: "2026-06-29T20:30:00.000-06:00",
    dueLabel: "Today, 8:00 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 10,
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
} as const;

export function getTodayTasks() {
  return mockTasks.filter((task) => task.day === "Monday");
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
