import type { CleaningTask } from "@/lib/tasks";

export function TaskKindIcon({
  className = "h-3 w-3",
  task,
}: {
  className?: string;
  task: Pick<CleaningTask, "taskKind">;
}) {
  if (task.taskKind === "trash") {
    return (
      <svg
        aria-hidden="true"
        className={`${className} shrink-0`}
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M5.25 3.25h5.5M6.25 3.25l.4-1h2.7l.4 1M4.25 5h7.5l-.45 8.25a1.5 1.5 0 0 1-1.5 1.42H6.2a1.5 1.5 0 0 1-1.5-1.42L4.25 5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path
          d="M7 7v5M9 7v5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  if (task.taskKind === "bathroom") {
    return (
      <svg
        aria-hidden="true"
        className={`${className} shrink-0`}
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M4 7.25h8.75v1.5a4 4 0 0 1-4 4H7.25a4 4 0 0 1-4-4v-.75A.75.75 0 0 1 4 7.25Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path
          d="M5.25 7.25V4.5a2 2 0 0 1 2-2h.5M6 12.75l-.75 1.5M10 12.75l.75 1.5M9.25 3.25h2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  return null;
}
