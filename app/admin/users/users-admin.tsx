"use client";

import { useEffect, useState } from "react";
import { UserColorPicker } from "@/components/user-color-picker";
import { getLoggedInUser, getUserRequestHeaders } from "@/lib/auth";
import type { HouseUser } from "@/lib/tasks";
import { defaultMemberPin } from "@/lib/users";

type AdminUser = Pick<HouseUser, "id" | "name" | "role" | "color">;

type UsersResponse = {
  users?: AdminUser[];
  message?: string;
};

export function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      const response = await fetch("/api/users");
      const result = (await response.json()) as UsersResponse;

      if (isMounted && response.ok && result.users) {
        setUsers(result.users);
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  async function savePin(userId: string, pin: string) {
    const currentUser = getLoggedInUser();
    const actorPin = window.prompt("Enter your admin PIN to confirm this reset.");

    if (!actorPin) {
      throw new Error("Admin PIN is required to reset a PIN.");
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(currentUser) },
      body: JSON.stringify({ userId, pin, actorPin }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok || !result.users) {
      throw new Error(result.message ?? "PIN update failed.");
    }

    setUsers(result.users);
  }

  async function resetPin(user: AdminUser) {
    await savePin(user.id, defaultMemberPin);
    setMessage(`${user.name}'s PIN was reset to ${defaultMemberPin}.`);
  }

  return (
    <>
      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="font-ui text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Calendar roster</p>
        <h2 className="mt-2 font-display text-xl font-bold">Users come from assigned calendar tasks</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every assignee found before the task title is added as a house member with the default PIN <strong>{defaultMemberPin}</strong>. Admins can reset any PIN, and each logged-in member can change their own PIN.
        </p>
        {message ? <p className="mt-4 rounded-2xl bg-slate-50 p-3 font-ui text-sm font-bold text-slate-700">{message}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user) => (
          <article key={user.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <UserColorPicker
                user={user}
                size="lg"
                description={`Applies to ${user.name}.`}
                onUsersChange={(nextUsers) => {
                  setUsers((currentUsers) =>
                    currentUsers.map((currentUser) => ({
                      ...currentUser,
                      color: nextUsers.find((nextUser) => nextUser.id === currentUser.id)?.color,
                    })),
                  );
                  setMessage(`Color updated for ${user.name}.`);
                }}
              />
              <div>
                <h2 className="font-display text-lg font-bold">{user.name}</h2>
                <p className="text-sm capitalize text-slate-600">{user.role}</p>
              </div>
            </div>
            <button onClick={() => resetPin(user)} className="mt-4 w-full rounded-full bg-slate-950 px-4 py-3 font-ui font-black text-white">
              Reset PIN to {defaultMemberPin}
            </button>
          </article>
        ))}
      </div>

    </>
  );
}
