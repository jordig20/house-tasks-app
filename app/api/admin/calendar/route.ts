import { NextResponse } from "next/server";
import { getBanffMonthRangeFromKey } from "@/lib/banff-time";
import { getCalendarTasks } from "@/lib/google-calendar";
import { getStoredHouseUsers } from "@/lib/user-store";

export async function POST(request: Request) {
  try {
    const actorUserId = request.headers.get("x-house-user-id");
    const body = (await request.json().catch(() => ({}))) as {
      actorPin?: string;
      monthStart?: string;
    };

    if (!actorUserId || !body.actorPin) {
      return NextResponse.json(
        { message: "Admin PIN proof is required." },
        { status: 401 },
      );
    }

    const users = await getStoredHouseUsers();
    const actor = users.find((user) => user.id === actorUserId);

    if (actor?.role !== "admin" || actor.pin !== body.actorPin) {
      return NextResponse.json(
        { message: "Admin PIN proof is required." },
        { status: 403 },
      );
    }

    if (!body.monthStart) {
      return NextResponse.json(
        { message: "Month is required." },
        { status: 400 },
      );
    }

    let range: ReturnType<typeof getBanffMonthRangeFromKey>;

    try {
      range = getBanffMonthRangeFromKey(body.monthStart);
    } catch {
      return NextResponse.json(
        { message: "Month must use YYYY-MM-01 format." },
        { status: 400 },
      );
    }

    const calendar = await getCalendarTasks(range.start, range.end);

    return NextResponse.json({
      tasks: calendar.tasks,
      warnings: calendar.warnings,
      isConfiguredFallback: calendar.isConfiguredFallback,
      users: users.map(({ id, name, role, color }) => ({ id, name, role, color })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Printable calendar could not be loaded.",
      },
      { status: 500 },
    );
  }
}
