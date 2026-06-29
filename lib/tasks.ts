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
  title: string;
  room: string;
  assigneeId: string;
  dueLabel: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  status: TaskStatus;
  durationMinutes: number;
};

export const mockUsers: HouseUser[] = [
  { id: "jordi", name: "Jordi", role: "admin", pin: "1234" },
  { id: "rafa", name: "Rafa", role: "member", pin: "1111" },
  { id: "alex", name: "Alex", role: "member", pin: "2222" },
];

export const mockTasks: CleaningTask[] = [
  {
    id: "mon-kitchen-counters",
    title: "Wipe counters and stovetop",
    room: "Kitchen",
    assigneeId: "jordi",
    dueLabel: "Today, 8:00 PM",
    day: "Monday",
    status: "pending",
    durationMinutes: 15,
  },
  {
    id: "mon-trash-recycling",
    title: "Take out trash and recycling",
    room: "Shared areas",
    assigneeId: "rafa",
    dueLabel: "Today, 9:00 PM",
    day: "Monday",
    status: "pending",
    durationMinutes: 10,
  },
  {
    id: "mon-living-room",
    title: "Vacuum the living room rug",
    room: "Living room",
    assigneeId: "alex",
    dueLabel: "Today, 9:30 PM",
    day: "Monday",
    status: "pending",
    durationMinutes: 20,
  },
  {
    id: "tue-bathroom-sink",
    title: "Clean bathroom sink and mirror",
    room: "Bathroom",
    assigneeId: "alex",
    dueLabel: "Tuesday, 7:00 PM",
    day: "Tuesday",
    status: "pending",
    durationMinutes: 20,
  },
  {
    id: "wed-fridge-check",
    title: "Clear expired food from fridge",
    room: "Kitchen",
    assigneeId: "rafa",
    dueLabel: "Wednesday, 8:00 PM",
    day: "Wednesday",
    status: "pending",
    durationMinutes: 15,
  },
  {
    id: "fri-mop-floor",
    title: "Mop kitchen floor",
    room: "Kitchen",
    assigneeId: "jordi",
    dueLabel: "Friday, 6:30 PM",
    day: "Friday",
    status: "pending",
    durationMinutes: 25,
  },
  {
    id: "sun-reset",
    title: "Reset shared supplies shelf",
    room: "Hall closet",
    assigneeId: "rafa",
    dueLabel: "Sunday, 11:00 AM",
    day: "Sunday",
    status: "pending",
    durationMinutes: 15,
  },
];

export const recentHistory: CleaningTask[] = [
  {
    id: "history-bathroom-floor",
    title: "Sweep bathroom floor",
    room: "Bathroom",
    assigneeId: "alex",
    dueLabel: "Yesterday, 7:15 PM",
    day: "Sunday",
    status: "done",
    durationMinutes: 12,
  },
  {
    id: "history-dishes-reset",
    title: "Empty dishwasher and reset sink",
    room: "Kitchen",
    assigneeId: "jordi",
    dueLabel: "Last Saturday, 10:00 AM",
    day: "Saturday",
    status: "skipped",
    durationMinutes: 10,
  },
];

export const storageKeys = {
  currentUser: "houseflow.currentUser",
  taskStatuses: "houseflow.taskStatuses",
} as const;

export function getUserById(userId: string) {
  return mockUsers.find((user) => user.id === userId);
}

export function getAssigneeName(userId: string) {
  return getUserById(userId)?.name ?? "Unassigned";
}

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
