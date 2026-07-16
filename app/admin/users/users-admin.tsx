"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { UserColorPicker } from "@/components/user-color-picker";
import { getLoggedInUser, getUserRequestHeaders } from "@/lib/auth";
import type { HouseUser } from "@/lib/tasks";
import { defaultMemberPin } from "@/lib/users";

type AdminUser = Pick<
  HouseUser,
  | "id"
  | "name"
  | "role"
  | "color"
  | "email"
  | "emailRemindersEnabled"
  | "eveningRemindersEnabled"
>;

type UsersResponse = {
  users?: AdminUser[];
  message?: string;
};

export function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actorPin, setActorPin] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedAdminUsers, setHasLoadedAdminUsers] = useState(false);
  const hasLoadedAdminUsersRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicUsers() {
      const response = await fetch("/api/users");
      const result = (await response.json()) as UsersResponse;

      if (isMounted && !hasLoadedAdminUsersRef.current && response.ok && result.users) {
        setUsers(result.users);
        setHasLoadedAdminUsers(false);
      }
    }

    void loadPublicUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadAdminUsers(nextActorPin = actorPin) {
    const currentUser = getLoggedInUser();

    if (!nextActorPin) {
      throw new Error("Admin PIN is required to load email settings.");
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getUserRequestHeaders(currentUser) },
        body: JSON.stringify({ actorPin: nextActorPin }),
      });
      const result = (await response.json()) as UsersResponse;

      if (!response.ok || !result.users) {
        throw new Error(result.message ?? "Admin users load failed.");
      }

      hasLoadedAdminUsersRef.current = true;
      setUsers(result.users);
      setHasLoadedAdminUsers(true);
      setMessage("Email reminder settings loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdminPinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await loadAdminUsers(actorPin);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin users load failed.");
    }
  }

  async function savePin(userId: string, pin: string) {
    const currentUser = getLoggedInUser();
    const proof = actorPin || window.prompt("Enter your admin PIN to confirm this reset.");

    if (!proof) {
      throw new Error("Admin PIN is required to reset a PIN.");
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(currentUser) },
      body: JSON.stringify({ userId, pin, actorPin: proof }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok || !result.users) {
      throw new Error(result.message ?? "PIN update failed.");
    }

    await loadAdminUsers(proof);
  }

  async function saveEmailSettings({
    userId,
    email,
    emailRemindersEnabled,
    eveningRemindersEnabled,
  }: {
    userId: string;
    email: string;
    emailRemindersEnabled: boolean;
    eveningRemindersEnabled: boolean;
  }) {
    const currentUser = getLoggedInUser();
    const proof = actorPin || window.prompt("Enter your admin PIN to confirm this update.");

    if (!proof) {
      throw new Error("Admin PIN is required to update email settings.");
    }

    if (!hasLoadedAdminUsers) {
      throw new Error("Load email settings with the admin PIN before saving reminder preferences.");
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(currentUser) },
      body: JSON.stringify({
        userId,
        email,
        emailRemindersEnabled,
        eveningRemindersEnabled,
        actorPin: proof,
      }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok || !result.users) {
      throw new Error(result.message ?? "Email settings update failed.");
    }

    await loadAdminUsers(proof);
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
          Every assignee found before the task title is added as a house member with the default PIN <strong>{defaultMemberPin}</strong>. Admins can reset any PIN and can load email settings after proving the admin PIN.
        </p>
        <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleAdminPinSubmit}>
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-ui text-sm font-bold tracking-[0.3em] outline-none focus:border-slate-950"
            inputMode="numeric"
            maxLength={4}
            placeholder="Admin PIN"
            type="password"
            value={actorPin}
            onChange={(event) => setActorPin(event.target.value.replace(/\D/g, ""))}
          />
          <button
            className="rounded-full bg-slate-950 px-5 py-3 font-ui text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={actorPin.length !== 4 || isLoading}
            type="submit"
          >
            {isLoading ? "Loading…" : "Load email settings"}
          </button>
        </form>
        {message ? <p className="mt-4 rounded-2xl bg-slate-50 p-3 font-ui text-sm font-bold text-slate-700">{message}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user) => (
          <AdminUserCard
            key={`${user.id}-${user.email ?? ""}-${user.emailRemindersEnabled ?? ""}-${user.eveningRemindersEnabled ?? ""}`}
            onEmailSettingsSave={saveEmailSettings}
            onResetPin={resetPin}
            onUsersChange={(nextUsers) => {
              setUsers((currentUsers) =>
                currentUsers.map((currentUser) => ({
                  ...currentUser,
                  color: nextUsers.find((nextUser) => nextUser.id === currentUser.id)?.color,
                })),
              );
              setMessage(`Color updated for ${user.name}.`);
            }}
            canEditEmailSettings={hasLoadedAdminUsers}
            user={user}
          />
        ))}
      </div>

    </>
  );
}

function AdminUserCard({
  user,
  onEmailSettingsSave,
  onResetPin,
  onUsersChange,
  canEditEmailSettings,
}: {
  user: AdminUser;
  onEmailSettingsSave: (settings: {
    userId: string;
    email: string;
    emailRemindersEnabled: boolean;
    eveningRemindersEnabled: boolean;
  }) => Promise<void>;
  onResetPin: (user: AdminUser) => Promise<void>;
  onUsersChange: (users: Pick<HouseUser, "id" | "name" | "role" | "color">[]) => void;
  canEditEmailSettings: boolean;
}) {
  const [email, setEmail] = useState(user.email ?? "");
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(user.emailRemindersEnabled ?? false);
  const [eveningRemindersEnabled, setEveningRemindersEnabled] = useState(user.eveningRemindersEnabled ?? false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const hasKnownReminderPreferences =
    typeof user.emailRemindersEnabled === "boolean" &&
    typeof user.eveningRemindersEnabled === "boolean";
  const canSaveEmailSettings = canEditEmailSettings && hasKnownReminderPreferences;

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleEmailSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!canSaveEmailSettings) {
      setMessage("Load email settings with the admin PIN before saving reminder preferences.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await onEmailSettingsSave({
        userId: user.id,
        email: normalizedEmail,
        emailRemindersEnabled,
        eveningRemindersEnabled,
      });
      setEmail(normalizedEmail);
      setMessage("Email settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Email settings update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPin() {
    setIsSaving(true);
    setMessage("");

    try {
      await onResetPin(user);
      setMessage(`${user.name}'s PIN was reset to ${defaultMemberPin}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PIN reset failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <UserColorPicker
          user={user}
          size="lg"
          description={`Applies to ${user.name}.`}
          onUsersChange={onUsersChange}
        />
        <div>
          <h2 className="font-display text-lg font-bold">{user.name}</h2>
          <p className="text-sm capitalize text-slate-600">{user.role}</p>
        </div>
      </div>
      {canSaveEmailSettings ? (
        <form className="mt-4 space-y-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100" onSubmit={handleEmailSettingsSubmit}>
          <p className="font-ui text-xs font-black uppercase tracking-wide text-slate-500">
            Email reminders
          </p>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
            inputMode="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
            <span>Morning task emails</span>
            <input
              checked={emailRemindersEnabled}
              disabled={isSaving}
              type="checkbox"
              onChange={(event) => {
                setEmailRemindersEnabled(event.target.checked);
                if (!event.target.checked) {
                  setEveningRemindersEnabled(false);
                }
              }}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
            <span>Evening pending follow-up</span>
            <input
              checked={eveningRemindersEnabled}
              disabled={isSaving || !emailRemindersEnabled}
              type="checkbox"
              onChange={(event) => setEveningRemindersEnabled(event.target.checked)}
            />
          </label>
          <button
            className="w-full rounded-full bg-cyan-700 px-4 py-3 font-ui font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            type="submit"
          >
            Save email settings
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
          Load email settings with the admin PIN before editing reminder preferences.
        </div>
      )}
      <button disabled={isSaving} onClick={handleResetPin} className="mt-4 w-full rounded-full bg-slate-950 px-4 py-3 font-ui font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
        Reset PIN to {defaultMemberPin}
      </button>
      {message ? <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{message}</p> : null}
    </article>
  );
}
