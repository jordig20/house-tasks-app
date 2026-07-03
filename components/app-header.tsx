"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LoggedInUser } from "@/lib/auth";
import { clearLoggedInUser, saveLoggedInUser } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";
import { UserColorPicker } from "@/components/user-color-picker";

type UsersResponse = {
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

export function AppHeader({
  user,
  onUserChange,
}: {
  user: LoggedInUser | null;
  onUserChange: (user: LoggedInUser) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = user?.role === "admin" ? adminNavItems : memberNavItems;

  function signOut() {
    clearLoggedInUser();
    router.push("/login");
  }

  function updateCurrentUser(nextUser: LoggedInUser) {
    saveLoggedInUser(nextUser);
    onUserChange(nextUser);
  }

  async function updateCurrentUserPin(pin: string) {
    if (!user) {
      return;
    }

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, pin }),
    });
    const result = (await response.json()) as UsersResponse;

    if (!response.ok) {
      throw new Error(result.message ?? "PIN update failed.");
    }
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 mb-5 border-b border-white/70 bg-cream-50/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BrandLogo compact />
          <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-sm sm:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-bold hover:bg-cream-100 hover:text-roof-800 ${isActive ? "bg-cream-100 text-roof-800" : "text-slate-600"}`}
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
              <p className="text-sm font-bold text-slate-950">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <UserColorPicker
              user={user}
              size="sm"
              align="right"
              onUserChange={updateCurrentUser}
              showPinForm
              onPinChange={updateCurrentUserPin}
            />
            <button onClick={signOut} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
              Log out
            </button>
          </div>
        ) : (
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-roof-800 shadow-sm">Log in</Link>
        )}
      </div>
    </header>
  );
}
