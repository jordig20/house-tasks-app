"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  getLoggedInUser,
  saveLoggedInUser,
} from "@/lib/auth";
import { storageKeys, type HouseUser } from "@/lib/tasks";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";

type LoginResponse = {
  user?: Omit<HouseUser, "pin">;
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
  const [storedUserName, setStoredUserName] = useState<string | null>(null);
  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedUserId(
        (currentUserId) => currentUserId || (users[0]?.id ?? ""),
      );
      setStoredUserName(getLoggedInUser()?.name ?? null);
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
    setStoredUserName(result.user.name);
    router.push("/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <BrandLogo />
        <h1 className="mt-8 text-3xl font-black">Choose your account</h1>
        <p className="mt-2 text-slate-600">
          This is a local PIN login for the calendar-based house roster. The
          selected user is saved in{" "}
          <code className="rounded bg-cream-50 px-1 font-bold text-roof-800">
            {storageKeys.currentUser}
          </code>
          .
        </p>
        {storedUserName ? (
          <p className="mt-3 rounded-2xl bg-cream-50 p-3 text-sm font-bold text-roof-800">
            Current local session: {storedUserName}
          </p>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-slate-700">
              Account
            </label>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-roof-600 focus:border-roof-600 focus:outline-none"
              aria-expanded={isUserPickerOpen}
              onClick={() => setIsUserPickerOpen((isOpen) => !isOpen)}
            >
              {selectedUser ? (
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar user={selectedUser} />
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black">
                      {selectedUser.name}
                    </span>
                    <span className="block text-sm capitalize text-slate-500">
                      {selectedUser.role} · PIN required
                    </span>
                  </span>
                </span>
              ) : (
                <span className="font-bold text-slate-500">
                  Select account
                </span>
              )}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-50 ring-1 ring-cream-200">
                <span
                  className={`h-2.5 w-2.5 border-b-2 border-r-2 border-roof-800 transition ${isUserPickerOpen ? "-translate-y-0.5 rotate-[225deg]" : "translate-y-[-2px] rotate-45"}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isUserPickerOpen ? (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition ${selectedUserId === user.id ? "bg-cream-100 ring-1 ring-roof-600/30" : "hover:bg-cream-50"}`}
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
                      <span className="block truncate font-black">
                        {user.name}
                      </span>
                      <span className="block text-xs capitalize text-slate-500">
                        {user.role} · PIN required
                      </span>
                    </span>
                    {selectedUserId === user.id ? (
                      <span className="rounded-full bg-roof-800 px-2 py-1 text-xs font-black text-white">
                        Selected
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label htmlFor="pin" className="text-sm font-bold text-slate-700">
              PIN
            </label>
            <input
              id="pin"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg tracking-[0.4em] outline-none focus:border-roof-600"
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
            className="w-full rounded-full bg-roof-800 px-5 py-3 text-center font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
