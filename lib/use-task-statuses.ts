"use client";

import { useMemo, useState } from "react";
import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";

type TaskStatusMap = Record<string, TaskStatus>;

export function useTaskStatuses(tasks: CleaningTask[]) {
  const [statuses, setStatuses] = useState<TaskStatusMap>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const storedStatuses = window.localStorage.getItem(storageKeys.taskStatuses);
    return storedStatuses ? JSON.parse(storedStatuses) : {};
  });
  const isReady = true;

  function updateStatus(taskId: string, status: TaskStatus) {
    setStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses, [taskId]: status };
      window.localStorage.setItem(storageKeys.taskStatuses, JSON.stringify(nextStatuses));
      return nextStatuses;
    });
  }

  const tasksWithStatus = useMemo(
    () => tasks.map((task) => ({ ...task, status: statuses[task.id] ?? task.status })),
    [statuses, tasks],
  );

  return { isReady, statuses, tasksWithStatus, updateStatus };
}
