export type TaskStatus = "pending" | "done" | "upcoming";

export type CleaningTask = {
  id: string;
  title: string;
  room: string;
  assignee: string;
  scheduledFor: string;
  status: TaskStatus;
  durationMinutes: number;
};

export const todaysTasks: CleaningTask[] = [
  {
    id: "task-1",
    title: "Wipe counters and stovetop",
    room: "Kitchen",
    assignee: "Maya",
    scheduledFor: "Today, 8:00 AM",
    status: "done",
    durationMinutes: 15,
  },
  {
    id: "task-2",
    title: "Take out trash and recycling",
    room: "Shared areas",
    assignee: "Jon",
    scheduledFor: "Today, 7:00 PM",
    status: "pending",
    durationMinutes: 10,
  },
  {
    id: "task-3",
    title: "Vacuum living room rug",
    room: "Living room",
    assignee: "Ari",
    scheduledFor: "Today, 7:30 PM",
    status: "pending",
    durationMinutes: 20,
  },
];

export const weekTasks: CleaningTask[] = [
  ...todaysTasks,
  {
    id: "task-4",
    title: "Clean bathroom sink and mirror",
    room: "Bathroom",
    assignee: "Sam",
    scheduledFor: "Wednesday, 6:00 PM",
    status: "upcoming",
    durationMinutes: 20,
  },
  {
    id: "task-5",
    title: "Mop kitchen floor",
    room: "Kitchen",
    assignee: "Maya",
    scheduledFor: "Friday, 9:00 AM",
    status: "upcoming",
    durationMinutes: 25,
  },
];

export const historyTasks: CleaningTask[] = [
  {
    id: "history-1",
    title: "Deep clean fridge shelf",
    room: "Kitchen",
    assignee: "Jon",
    scheduledFor: "Yesterday, 6:30 PM",
    status: "done",
    durationMinutes: 30,
  },
  {
    id: "history-2",
    title: "Dust TV console",
    room: "Living room",
    assignee: "Ari",
    scheduledFor: "Last Sunday, 11:00 AM",
    status: "done",
    durationMinutes: 15,
  },
];

export const housemates = [
  { name: "Maya", role: "Admin", completed: 8 },
  { name: "Jon", role: "Housemate", completed: 6 },
  { name: "Ari", role: "Housemate", completed: 7 },
  { name: "Sam", role: "Housemate", completed: 5 },
];
