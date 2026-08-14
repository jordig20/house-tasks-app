import { getBanffDateKey } from "@/lib/banff-time";
import type { CleaningTask } from "@/lib/tasks";

export type PrintableCalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  tasks: CleaningTask[];
};

const monthStartPattern = /^(\d{4})-(\d{2})-01$/;

function parseMonthStart(monthStart: string) {
  const match = monthStartPattern.exec(monthStart);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);

  if (!match || month < 1 || month > 12) {
    throw new Error("Month must use YYYY-MM-01 format.");
  }

  return { year, month };
}

function dateKeyFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKeyFromUtcDate(date);
}

function getTaskEndKey(task: CleaningTask) {
  if (task.isAllDay) {
    return addDays(task.end.slice(0, 10), -1);
  }

  return getBanffDateKey(new Date(task.end));
}

export function getMonthStartKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateKey);

  if (!match) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  return `${match[1]}-${match[2]}-01`;
}

export function shiftMonth(monthStart: string, amount: number) {
  const { year, month } = parseMonthStart(monthStart);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function buildPrintableCalendar(
  monthStart: string,
  tasks: CleaningTask[],
): PrintableCalendarDay[] {
  const { year, month } = parseMonthStart(monthStart);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = Math.round(
    (nextMonth.getTime() - firstDay.getTime()) / 86_400_000,
  );
  const leadingDays = firstDay.getUTCDay();
  const totalDays = leadingDays + daysInMonth;
  const trailingDays = (7 - (totalDays % 7)) % 7;
  const visibleStart = addDays(monthStart, -leadingDays);
  const visibleEnd = addDays(visibleStart, totalDays + trailingDays - 1);
  const tasksByDate = new Map<string, CleaningTask[]>();

  for (const task of tasks) {
    let dateKey = task.date < visibleStart ? visibleStart : task.date;
    const taskEnd = getTaskEndKey(task);
    const endKey = taskEnd > visibleEnd ? visibleEnd : taskEnd;

    while (dateKey <= endKey) {
      const dayTasks = tasksByDate.get(dateKey) ?? [];
      dayTasks.push(task);
      tasksByDate.set(dateKey, dayTasks);
      dateKey = addDays(dateKey, 1);
    }
  }

  for (const dayTasks of tasksByDate.values()) {
    dayTasks.sort(
      (first, second) =>
        first.start.localeCompare(second.start) ||
        first.title.localeCompare(second.title) ||
        first.id.localeCompare(second.id),
    );
  }

  return Array.from({ length: totalDays + trailingDays }, (_, index) => {
    const dateKey = addDays(visibleStart, index);

    return {
      dateKey,
      dayNumber: Number(dateKey.slice(-2)),
      isCurrentMonth: dateKey.startsWith(monthStart.slice(0, 7)),
      tasks: tasksByDate.get(dateKey) ?? [],
    };
  });
}
