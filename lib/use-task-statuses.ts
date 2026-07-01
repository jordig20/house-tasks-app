"use client";

import { useEffect, useMemo, useState } from "react";
import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { getTaskCompletionKey, storageKeys } from "@/lib/tasks";

type TaskStatusMap = Record<string, TaskStatus>;

export function useTaskStatuses(tasks: CleaningTask[]) {
  const [statuses, setStatuses] = useState<TaskStatusMap>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const storedStatuses = window.localStorage.getItem(
        storageKeys.taskStatuses,
      );

      try {
        setStatuses(storedStatuses ? JSON.parse(storedStatuses) : {});
      } catch {
        window.localStorage.removeItem(storageKeys.taskStatuses);
        setStatuses({});
      }

      setIsReady(true);
    });
  }, []);

  function updateStatus(statusKey: string, status: TaskStatus) {
    setStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses, [statusKey]: status };
      window.localStorage.setItem(storageKeys.taskStatuses, JSON.stringify(nextStatuses));
      return nextStatuses;
    });
  }

  function getTaskStatus(task: CleaningTask, date = task.date) {
    return statuses[getTaskCompletionKey(task, date)] ?? task.status;
  }

  function updateTaskStatus(
    task: CleaningTask,
    status: TaskStatus,
    date = task.date,
  ) {
    updateStatus(getTaskCompletionKey(task, date), status);
  }

  const tasksWithStatus = useMemo(
    () => tasks.map((task) => ({ ...task, status: getTaskStatus(task) })),
    // getTaskStatus is intentionally inline logic over statuses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuses, tasks],
  );

  return {
    isReady,
    statuses,
    tasksWithStatus,
    getTaskStatus,
    updateStatus,
    updateTaskStatus,
  };
}
