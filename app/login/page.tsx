"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getLoggedInUser, saveLoggedInUser, validateMockLogin } from "@/lib/auth";
import { mockUsers, storageKeys } from "@/lib/tasks";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(mockUsers[0].id);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [storedUserName, setStoredUserName] = useState<string | null>(null);

  useEffect(() => {
    setStoredUserName(getLoggedInUser()?.name ?? null);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loggedInUser = validateMockLogin(selectedUserId, pin);

    if (!loggedInUser) {
      setError("That PIN does not match the selected mock user.");
      setPin("");
      return;
    }

    saveLoggedInUser(loggedInUser);
    setStoredUserName(loggedInUser.name);
    router.push("/today");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <BrandLogo />
        <h1 className="mt-8 text-3xl font-black">Choose your housemate</h1>
        <p className="mt-2 text-slate-600">This is a local mock login only. The selected user is saved in <code className="rounded bg-cream-50 px-1 font-bold text-roof-800">{storageKeys.currentUser}</code>.</p>
        {storedUserName ? (
          <p className="mt-3 rounded-2xl bg-cream-50 p-3 text-sm font-bold text-roof-800">Current local session: {storedUserName}</p>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            {mockUsers.map((user) => (
              <label
                key={user.id}
                className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-4 transition ${selectedUserId === user.id ? "border-roof-600 bg-cream-100" : "border-slate-200 bg-white"}`}
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
                  <span className="text-sm capitalize text-slate-500">{user.role} · mock PIN required</span>
                </span>
              </label>
            ))}
          </div>

          <div>
            <label htmlFor="pin" className="text-sm font-bold text-slate-700">PIN</label>
            <input
              id="pin"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg tracking-[0.4em] outline-none focus:border-roof-600"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              type="password"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value);
                setError("");
              }}
            />
            {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
          </div>

          <button className="w-full rounded-full bg-roof-800 px-5 py-3 text-center font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={pin.length !== 4}>
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
