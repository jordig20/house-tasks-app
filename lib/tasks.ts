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

export function parseCalendarTaskTitle(eventTitle: string) {
  const [peoplePart, ...taskParts] = eventTitle.split(" - ");

  if (taskParts.length === 0) {
    return {
      assignedTo: [],
      taskTitle: eventTitle.trim(),
    };
  }

  return {
    assignedTo: peoplePart
      .split("&")
      .map((person) => person.trim())
      .filter(Boolean),
    taskTitle: taskParts.join(" - ").trim(),
  };
}

export const storageKeys = {
  currentUser: "540aCleaning.currentUser",
  taskStatuses: "540aCleaning.taskStatuses",
  users: "540aCleaning.users",
} as const;

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
