"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LoggedInUser } from "@/lib/auth";
import { clearLoggedInUser, getUserRequestHeaders, saveLoggedInUser } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";
import { UserColorPicker } from "@/components/user-color-picker";

type UsersResponse = {
  users?: LoggedInUser[];
  message?: string;
};

const memberNavItems = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/month", label: "Month" },
];

const adminNavItems = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/month", label: "Month" },
  { href: "/admin/users", label: "Users" },
];

type PinReminderState = {
  dismissed: boolean;
  userId?: string;
};

export function AppHeader({
  user,
  onUserChange,
}: {
  user: LoggedInUser | null;
  onUserChange: (user: LoggedInUser) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pinReminderState, setPinReminderState] = useState<PinReminderState>({
    dismissed: false,
  });
  const navItems = user?.role === "admin" ? adminNavItems : memberNavItems;
  const needsEmail = Boolean(user && (user.mustAddEmail || !user.email));
  const dismissedPinReminder =
    pinReminderState.userId === user?.id && pinReminderState.dismissed;

  function signOut() {
    clearLoggedInUser();
    router.push("/login");
  }

  function updateCurrentUser(nextUser: LoggedInUser) {
    saveLoggedInUser(nextUser);
    onUserChange(nextUser);
  }

  async function updateCurrentUserPin(pin: string, currentPin: string) {
    if (!user) {
      return;
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(user) },
      body: JSON.stringify({ userId: user.id, pin, currentPin }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok) {
      throw new Error(result.message ?? "PIN update failed.");
    }

    updateCurrentUser({ ...user, mustChangePin: false });
    setPinReminderState({ dismissed: false, userId: user.id });
  }

  async function updateCurrentUserEmail(email: string, currentPin: string) {
    if (!user) {
      return;
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(user) },
      body: JSON.stringify({ userId: user.id, email, currentPin }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok) {
      throw new Error(result.message ?? "Email update failed.");
    }

    updateCurrentUser({ ...user, email, mustAddEmail: false });
  }

  async function updateCurrentUserEmailPreferences(preferences: {
    emailRemindersEnabled?: boolean;
    eveningRemindersEnabled?: boolean;
  }, currentPin: string) {
    if (!user) {
      return;
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getUserRequestHeaders(user) },
      body: JSON.stringify({ userId: user.id, ...preferences, currentPin }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok) {
      throw new Error(result.message ?? "Email settings update failed.");
    }

    updateCurrentUser({ ...user, ...preferences });
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 mb-5 border-b border-white/70 bg-slate-50/85 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BrandLogo compact />
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur sm:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 font-ui text-sm font-bold transition hover:bg-slate-100 hover:text-slate-950 ${isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-ui text-sm font-bold text-slate-950">{user.name}</p>
              <p className="font-ui text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <UserColorPicker
              user={user}
              size="sm"
              onUserChange={updateCurrentUser}
              showPinForm
              onPinChange={updateCurrentUserPin}
              showEmailForm
              onEmailChange={updateCurrentUserEmail}
              onEmailPreferencesChange={updateCurrentUserEmailPreferences}
              forceOpen={Boolean(
                (user.mustChangePin || needsEmail) && !dismissedPinReminder,
              )}
              pinReminder={
                user.mustChangePin
                  ? "Your PIN is still 0000. Please choose a private PIN."
                  : undefined
              }
              emailReminder={
                needsEmail
                  ? "Add your email to receive task reminders. You can turn reminders off anytime."
                  : undefined
              }
              onClose={() =>
                setPinReminderState({ dismissed: true, userId: user.id })
              }
            />
            <button onClick={signOut} className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 font-ui text-xs font-bold text-slate-600 shadow-sm transition hover:text-slate-950">
              Log out
            </button>
          </div>
        ) : (
          <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 font-ui text-sm font-bold text-white shadow-sm">Log in</Link>
        )}
      </div>
    </header>
  );
}
