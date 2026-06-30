"use client";

import { useState, type FormEvent } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { getLoggedInUser } from "@/lib/auth";
import type { CleaningTask, HouseUser } from "@/lib/tasks";
import { defaultMemberPin, getHouseUsers, updateUserPin } from "@/lib/users";

function isFourDigitPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

export function UsersAdmin({ tasks }: { tasks: Pick<CleaningTask, "assignedTo">[] }) {
  const [users, setUsers] = useState<HouseUser[]>(() => getHouseUsers(tasks));
  const [currentUserId] = useState<string | null>(() => getLoggedInUser()?.id ?? null);
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;


  function resetPin(user: HouseUser) {
    setUsers(updateUserPin(user.id, defaultMemberPin, tasks));
    setMessage(`${user.name}'s PIN was reset to ${defaultMemberPin}.`);
  }

  function handleChangeOwnPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser || !isFourDigitPin(newPin)) {
      setMessage("Enter a 4-digit PIN before saving.");
      return;
    }

    setUsers(updateUserPin(currentUser.id, newPin, tasks));
    setMessage("Your PIN was updated.");
    setNewPin("");
  }

  return (
    <>
      <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-roof-800">Calendar roster</p>
        <h2 className="mt-2 text-xl font-black">Users come from assigned calendar tasks</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every assignee found before the task title is added as a house member with the default PIN <strong>{defaultMemberPin}</strong>. Admins can reset any PIN, and each logged-in member can change their own PIN.
        </p>
        {message ? <p className="mt-4 rounded-2xl bg-cream-50 p-3 text-sm font-bold text-roof-800">{message}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user) => (
          <article key={user.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div>
                <h2 className="text-lg font-black">{user.name}</h2>
                <p className="text-sm capitalize text-slate-600">{user.role}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-cream-50 p-3 text-sm text-slate-700">
              Current PIN: <strong className="text-slate-950">{user.pin}</strong>
            </div>
            <button onClick={() => resetPin(user)} className="mt-4 w-full rounded-full bg-roof-800 px-4 py-3 font-black text-white">
              Reset PIN to {defaultMemberPin}
            </button>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border-2 border-dashed border-cream-200 bg-white/70 p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-roof-800">My PIN</p>
        <h2 className="mt-2 text-xl font-black">Change your PIN</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleChangeOwnPin}>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 tracking-[0.4em] outline-none focus:border-roof-600"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            type="password"
            value={newPin}
            onChange={(event) => {
              setNewPin(event.target.value.replace(/\D/g, ""));
              setMessage("");
            }}
          />
          <button className="rounded-full bg-olive-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!isFourDigitPin(newPin)} type="submit">
            Save PIN
          </button>
        </form>
      </section>
    </>
  );
}
