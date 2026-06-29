"use client";

import { useEffect, useMemo, useState } from "react";
import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";

type TaskStatusMap = Record<string, TaskStatus>;

export function useTaskStatuses(tasks: CleaningTask[]) {
  const [statuses, setStatuses] = useState<TaskStatusMap>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedStatuses = window.localStorage.getItem(storageKeys.taskStatuses);
    setStatuses(storedStatuses ? JSON.parse(storedStatuses) : {});
    setIsReady(true);
  }, []);

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
