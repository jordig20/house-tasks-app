import { NextResponse } from "next/server";
import {
  getStoredTaskStatuses,
  updateStoredTaskStatus,
} from "@/lib/task-status-store";
import type { TaskStatus } from "@/lib/tasks";

const validStatuses: TaskStatus[] = ["pending", "done", "skipped"];

export async function GET() {
  const statuses = await getStoredTaskStatuses();

  return NextResponse.json({ statuses });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      completionKey?: string;
      taskId?: string;
      dateKey?: string;
      status?: TaskStatus;
      updatedBy?: string;
    };

    if (
      !body.completionKey ||
      !body.taskId ||
      !body.dateKey ||
      !body.status ||
      !validStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        { message: "Valid task status payload is required." },
        { status: 400 },
      );
    }

    await updateStoredTaskStatus({
      completionKey: body.completionKey,
      taskId: body.taskId,
      dateKey: body.dateKey,
      status: body.status,
      updatedBy: body.updatedBy,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Task status update failed.",
      },
      { status: 500 },
    );
  }
}
