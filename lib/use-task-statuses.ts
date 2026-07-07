"use client";

import { useEffect, useMemo, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { getTaskCompletionKey } from "@/lib/tasks";

type TaskStatusMap = Record<string, TaskStatus>;
type TaskStatusesResponse = {
  statuses?: TaskStatusMap;
};

export function useTaskStatuses(tasks: CleaningTask[]) {
  const [statuses, setStatuses] = useState<TaskStatusMap>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStatuses() {
      try {
        const response = await fetch("/api/task-statuses");
        const result = (await response.json()) as TaskStatusesResponse;

        if (isMounted) {
          setStatuses(result.statuses ?? {});
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadStatuses();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateStatus(
    statusKey: string,
    status: TaskStatus,
    task?: CleaningTask,
    date = task?.date,
  ) {
    setStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses, [statusKey]: status };
      return nextStatuses;
    });

    if (task && date) {
      const currentUser = getLoggedInUser();

      void fetch("/api/task-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionKey: statusKey,
          taskId: task.id,
          dateKey: date,
          status,
          updatedBy: currentUser?.id,
        }),
      }).catch(() => undefined);
    }
  }

  function getTaskStatus(task: CleaningTask, date = task.date) {
    return (
      statuses[getTaskCompletionKey(task, date)] ??
      (task.completionMode === "daily" ? "pending" : task.status)
    );
  }

  function updateTaskStatus(
    task: CleaningTask,
    status: TaskStatus,
    date = task.date,
  ) {
    updateStatus(getTaskCompletionKey(task, date), status, task, date);
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
