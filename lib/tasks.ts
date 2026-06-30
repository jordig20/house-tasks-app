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
  sourceTitle: string;
  title: string;
  assignedTo: string[];
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
  sourceTitle,
  dueLabel,
  dateLabel,
  day,
  durationMinutes,
  status = "pending",
}: {
  id: string;
  sourceTitle: string;
  dueLabel: string;
  dateLabel: string;
  day: CleaningTask["day"];
  durationMinutes: number;
  status?: TaskStatus;
}): CleaningTask {
  const parsedTitle = parseCalendarTaskTitle(sourceTitle);

  return {
    id,
    sourceTitle,
    title: parsedTitle.taskTitle,
    assignedTo: parsedTitle.assignedTo,
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
    dueLabel: "Today, 8:00 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 10,
  }),
  createMockCalendarTask({
    id: "mon-rafaela-jordi-bathroom",
    sourceTitle: "Rafaela & Jordi - Bathroom",
    dueLabel: "Today, 8:30 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "mon-michelle-zora-bathroom",
    sourceTitle: "Michelle & Zora - Bathroom",
    dueLabel: "Today, 9:00 PM",
    dateLabel: "Monday, Jun 29",
    day: "Monday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "tue-ellie-tilder-bathroom-cl",
    sourceTitle: "Ellie & Tilder - Bathroom Cl",
    dueLabel: "Tuesday, 7:00 PM",
    dateLabel: "Tuesday, Jun 30",
    day: "Tuesday",
    durationMinutes: 20,
  }),
  createMockCalendarTask({
    id: "wed-nico-bathroom-downstair",
    sourceTitle: "Nico - Bathroom Downstair",
    dueLabel: "Wednesday, 8:00 PM",
    dateLabel: "Wednesday, Jul 1",
    day: "Wednesday",
    durationMinutes: 20,
  }),
  createMockCalendarTask({
    id: "fri-jordi-kitchen",
    sourceTitle: "Jordi - Kitchen",
    dueLabel: "Friday, 6:30 PM",
    dateLabel: "Friday, Jul 3",
    day: "Friday",
    durationMinutes: 25,
  }),
  createMockCalendarTask({
    id: "sun-rafaela-supplies-reset",
    sourceTitle: "Rafaela - Supplies Reset",
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
    dueLabel: "Yesterday, 7:15 PM",
    dateLabel: "Sunday, Jun 28",
    day: "Sunday",
    status: "done",
    durationMinutes: 12,
  }),
  createMockCalendarTask({
    id: "history-dishes-reset",
    sourceTitle: "Jordi - Dishwasher Reset",
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
