import { NextResponse } from "next/server";
import { validateStoredLogin } from "@/lib/user-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string; pin?: string };

  if (!body.userId || !body.pin) {
    return NextResponse.json({ message: "User and PIN are required." }, { status: 400 });
  }

  const user = await validateStoredLogin(body.userId, body.pin);

  if (!user) {
    return NextResponse.json(
      { message: "That PIN does not match the selected user." },
      { status: 401 },
    );
  }

  return NextResponse.json({ user });
}
