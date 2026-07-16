import type { CleaningTask, TaskStatus } from "@/lib/tasks";

export type TaskDateRange = {
  startKey: string;
  endKey: string;
};

export type TaskInstance = {
  task: CleaningTask;
  dateKey: string;
  statusKey: string;
  sortTime: number;
};

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseTaskDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

export function getTaskDisplayEndDate(task: CleaningTask) {
  const endDate = parseTaskDate(task.end);

  if (task.isAllDay) {
    endDate.setDate(endDate.getDate() - 1);
  }

  return endDate;
}

export function getTaskDisplayEndKey(task: CleaningTask) {
  return getLocalDateKey(getTaskDisplayEndDate(task));
}

export function isTaskMultiDay(task: CleaningTask) {
  const startDate = parseTaskDate(task.start);
  const endDate = getTaskDisplayEndDate(task);

  return startDate.toDateString() !== endDate.toDateString();
}

export function getTaskCompletionKey(task: CleaningTask, dateKey = task.date) {
  if (task.completionMode === "daily") {
    return `daily:${task.id}:${dateKey}`;
  }

  return `event:${task.id}`;
}

export function getResolvedTaskStatus(
  task: CleaningTask,
  dateKey: string,
  statuses: Partial<Record<string, TaskStatus | string>>,
): TaskStatus {
  return (
    (statuses[getTaskCompletionKey(task, dateKey)] as TaskStatus | undefined) ??
    (task.completionMode === "daily" ? "pending" : task.status)
  );
}

export function taskOverlapsDateRange(
  task: CleaningTask,
  range: { startKey: string; endExclusiveKey: string },
) {
  return task.date < range.endExclusiveKey && getTaskDisplayEndKey(task) >= range.startKey;
}

function isWithinRange(dateKey: string, range?: TaskDateRange) {
  if (!range) {
    return true;
  }

  return dateKey >= range.startKey && dateKey <= range.endKey;
}

export function getTaskInstances(
  task: CleaningTask,
  range?: TaskDateRange,
): TaskInstance[] {
  const instances: TaskInstance[] = [];
  const endKey = getTaskDisplayEndKey(task);
  const currentDate = parseTaskDate(task.date);

  while (getLocalDateKey(currentDate) <= endKey) {
    const dateKey = getLocalDateKey(currentDate);

    if (isWithinRange(dateKey, range)) {
      instances.push({
        task,
        dateKey,
        statusKey: getTaskCompletionKey(task, dateKey),
        sortTime: currentDate.getTime(),
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances;
}
