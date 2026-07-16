import { describe, expect, it } from "vitest";
import {
  applyOptimisticStatusUpdate,
  rollbackStatusUpdate,
} from "@/lib/use-task-statuses";
import type { TaskStatus } from "@/lib/tasks";

describe("status update resilience", () => {
  it("applies a quiet optimistic status update", () => {
    const statuses: Record<string, TaskStatus> = {
      "task-1:2026-07-16": "pending",
    };

    expect(
      applyOptimisticStatusUpdate(statuses, "task-1:2026-07-16", "done"),
    ).toEqual({ "task-1:2026-07-16": "done" });
  });

  it("rolls failed optimistic updates back to the last confirmed status", () => {
    const statuses: Record<string, TaskStatus> = {
      "task-1:2026-07-16": "done",
    };

    expect(
      rollbackStatusUpdate(statuses, "task-1:2026-07-16", "pending"),
    ).toEqual({ "task-1:2026-07-16": "pending" });
  });

  it("removes a failed optimistic-only status when no confirmed status exists", () => {
    const statuses: Record<string, TaskStatus> = {
      "task-1:2026-07-16": "done",
    };

    expect(rollbackStatusUpdate(statuses, "task-1:2026-07-16")).toEqual({});
  });
});
