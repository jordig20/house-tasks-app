"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getLoggedInUser } from "@/lib/auth";
import type { CleaningTask, TaskStatus } from "@/lib/tasks";
import { getTaskCompletionKey } from "@/lib/tasks";

type TaskStatusMap = Record<string, TaskStatus>;
type TaskStatusesResponse = {
  statuses?: TaskStatusMap;
};
export type StatusUpdateError = {
  statusKey: string;
  message: string;
};

export function applyOptimisticStatusUpdate(
  currentStatuses: TaskStatusMap,
  statusKey: string,
  status: TaskStatus,
) {
  return { ...currentStatuses, [statusKey]: status };
}

export function rollbackStatusUpdate(
  currentStatuses: TaskStatusMap,
  statusKey: string,
  previousStatus?: TaskStatus,
) {
  const nextStatuses = { ...currentStatuses };

  if (previousStatus) {
    nextStatuses[statusKey] = previousStatus;
  } else {
    delete nextStatuses[statusKey];
  }

  return nextStatuses;
}

export function rollbackStatusUpdateToConfirmed(
  currentStatuses: TaskStatusMap,
  confirmedStatuses: TaskStatusMap,
  statusKey: string,
) {
  return rollbackStatusUpdate(
    currentStatuses,
    statusKey,
    confirmedStatuses[statusKey],
  );
}

function getStatusUpdateErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Task status update failed. Your change was not saved.";
}

export function useTaskStatuses(tasks: CleaningTask[]) {
  const [statuses, setStatuses] = useState<TaskStatusMap>({});
  const [, setConfirmedStatuses] = useState<TaskStatusMap>({});
  const confirmedStatusesRef = useRef<TaskStatusMap>({});
  const [pendingStatusKeys, setPendingStatusKeys] = useState<string[]>([]);
  const [statusUpdateError, setStatusUpdateError] =
    useState<StatusUpdateError | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStatuses() {
      try {
        const response = await fetch("/api/task-statuses");
        const result = (await response.json()) as TaskStatusesResponse;

        if (isMounted) {
          const loadedStatuses = result.statuses ?? {};

          confirmedStatusesRef.current = loadedStatuses;
          setStatuses(loadedStatuses);
          setConfirmedStatuses(loadedStatuses);
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
    setStatuses((currentStatuses) =>
      applyOptimisticStatusUpdate(currentStatuses, statusKey, status),
    );

    if (task && date) {
      const currentUser = getLoggedInUser();

      setStatusUpdateError(null);
      setPendingStatusKeys((currentKeys) =>
        currentKeys.includes(statusKey)
          ? currentKeys
          : [...currentKeys, statusKey],
      );

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
      })
        .then(async (response) => {
          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as {
              message?: string;
            } | null;

            throw new Error(
              result?.message ?? "Task status update failed. Your change was not saved.",
            );
          }

          setConfirmedStatuses((currentStatuses) => {
            const nextConfirmedStatuses = applyOptimisticStatusUpdate(
              currentStatuses,
              statusKey,
              status,
            );

            confirmedStatusesRef.current = nextConfirmedStatuses;

            return nextConfirmedStatuses;
          });
        })
        .catch((error: unknown) => {
          setStatuses((currentStatuses) =>
            rollbackStatusUpdateToConfirmed(
              currentStatuses,
              confirmedStatusesRef.current,
              statusKey,
            ),
          );
          setStatusUpdateError({
            statusKey,
            message: getStatusUpdateErrorMessage(error),
          });
        })
        .finally(() => {
          setPendingStatusKeys((currentKeys) =>
            currentKeys.filter((key) => key !== statusKey),
          );
        });
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
    pendingStatusKeys,
    statuses,
    statusUpdateError,
    tasksWithStatus,
    getTaskStatus,
    updateStatus,
    updateTaskStatus,
  };
}
