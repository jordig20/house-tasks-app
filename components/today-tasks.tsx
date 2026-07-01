"use client";

import { TaskCard } from "@/components/task-card";
import { useTaskStatuses } from "@/lib/use-task-statuses";
import { getLocalDateKey, type CleaningTask } from "@/lib/tasks";

export function TodayTasks({ tasks }: { tasks: CleaningTask[] }) {
  const { getTaskStatus, updateTaskStatus } = useTaskStatuses(tasks);
  const todayKey = getLocalDateKey(new Date());
  const tasksWithTodayStatus = tasks.map((task) => ({
    ...task,
    status: getTaskStatus(task, todayKey),
  }));
  const completedCount = tasksWithTodayStatus.filter((task) => task.status === "done").length;
  const progressWidth = tasksWithTodayStatus.length > 0 ? (completedCount / tasksWithTodayStatus.length) * 100 : 0;

  return (
    <>
      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Merged read-only Google Calendar events for today</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-roof-800" style={{ width: `${progressWidth}%` }} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">
          {completedCount} of {tasksWithTodayStatus.length} calendar tasks done
        </p>
      </section>

      <div className="space-y-4">
        {tasksWithTodayStatus.length > 0 ? (
          tasksWithTodayStatus.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={task.status}
              onStatusChange={(selectedTask, status) =>
                updateTaskStatus(selectedTask, status, todayKey)
              }
            />
          ))
        ) : (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
            <h2 className="text-xl font-black">No calendar tasks today</h2>
            <p className="mt-2 text-slate-600">Shared calendar events will appear here when scheduled.</p>
          </section>
        )}
      </div>
    </>
  );
}
