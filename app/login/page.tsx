"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { mockUsers, storageKeys } from "@/lib/tasks";
import { UserAvatar } from "@/components/user-avatar";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = mockUsers.find((candidate) => candidate.id === selectedUserId);

    if (!user || user.pin !== pin) {
      setError("PIN does not match this mock user.");
      return;
    }

    window.localStorage.setItem(storageKeys.currentUser, JSON.stringify(user));
    router.push("/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <Link href="/" className="text-sm font-bold text-sage-700">← HouseFlow</Link>
        <h1 className="mt-8 text-3xl font-black">Choose your housemate</h1>
        <p className="mt-2 text-slate-600">This is a local mock login only. No real authentication is connected yet.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            {mockUsers.map((user) => (
              <label
                key={user.id}
                className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-4 transition ${selectedUserId === user.id ? "border-sage-500 bg-sage-50" : "border-slate-200 bg-white"}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="user"
                  value={user.id}
                  checked={selectedUserId === user.id}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                />
                <UserAvatar user={user} />
                <span>
                  <span className="block font-black">{user.name}</span>
                  <span className="text-sm capitalize text-slate-500">{user.role} · PIN {user.pin}</span>
                </span>
              </label>
            ))}
          </div>

          <div>
            <label htmlFor="pin" className="text-sm font-bold text-slate-700">PIN</label>
            <input
              id="pin"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg tracking-[0.4em] outline-none focus:border-sage-500"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
            {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
          </div>

          <button className="w-full rounded-full bg-sage-700 px-5 py-3 text-center font-bold text-white" type="submit">
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
