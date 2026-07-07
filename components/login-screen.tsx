"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { saveLoggedInUser, type LoggedInUser } from "@/lib/auth";
import type { HouseUser } from "@/lib/tasks";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";

type LoginResponse = {
  user?: LoggedInUser;
  message?: string;
};

export function LoginScreen({ users: initialUsers }: { users: HouseUser[] }) {
  const router = useRouter();
  const [users] = useState<HouseUser[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedUserId(
        (currentUserId) => currentUserId || (users[0]?.id ?? ""),
      );
    });
  }, [users]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, pin }),
    });
    const result = (await response.json()) as LoginResponse;

    if (!response.ok || !result.user) {
      setError(result.message ?? "That PIN does not match the selected user.");
      setPin("");
      setIsSubmitting(false);
      return;
    }

    saveLoggedInUser(result.user);
    router.push("/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <BrandLogo />

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="font-ui text-sm font-bold text-slate-700">
              Account
            </label>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm transition hover:border-slate-400 focus:border-slate-900 focus:outline-none"
              aria-expanded={isUserPickerOpen}
              onClick={() => setIsUserPickerOpen((isOpen) => !isOpen)}
            >
              {selectedUser ? (
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar user={selectedUser} />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-bold">
                      {selectedUser.name}
                    </span>
                    <span className="block font-ui text-sm capitalize text-slate-500">
                      {selectedUser.role} · PIN required
                    </span>
                  </span>
                </span>
              ) : (
                <span className="font-bold text-slate-500">
                  Select account
                </span>
              )}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                <span
                  className={`h-2.5 w-2.5 border-b-2 border-r-2 border-slate-900 transition ${isUserPickerOpen ? "-translate-y-0.5 rotate-[225deg]" : "translate-y-[-2px] rotate-45"}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isUserPickerOpen ? (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition ${selectedUserId === user.id ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="user"
                      value={user.id}
                      checked={selectedUserId === user.id}
                      onChange={(event) => {
                        setSelectedUserId(event.target.value);
                        setIsUserPickerOpen(false);
                        setPin("");
                        setError("");
                      }}
                    />
                    <UserAvatar user={user} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-bold">
                        {user.name}
                      </span>
                      <span className="block font-ui text-xs capitalize text-slate-500">
                        {user.role} · PIN required
                      </span>
                    </span>
                    {selectedUserId === user.id ? (
                      <span className="rounded-full bg-slate-950 px-2 py-1 font-ui text-xs font-black text-white">
                        Selected
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label htmlFor="pin" className="font-ui text-sm font-bold text-slate-700">
              PIN
            </label>
            <input
              id="pin"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg tracking-[0.4em] outline-none focus:border-slate-950"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              type="password"
              autoComplete="one-time-code"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value);
                setError("");
              }}
            />
            {error ? (
              <p className="mt-2 text-sm font-bold text-red-600">{error}</p>
            ) : null}
          </div>

          <button
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-center font-ui font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            type="submit"
            disabled={pin.length !== 4 || isSubmitting}
          >
            {isSubmitting ? "Entering..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
