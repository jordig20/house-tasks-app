"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HouseUser } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";
import { UserAvatar } from "@/components/user-avatar";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/history", label: "History" },
  { href: "/admin/users", label: "Users" },
];

export function AppHeader({ user }: { user: HouseUser | null }) {
  const router = useRouter();

  function signOut() {
    window.localStorage.removeItem(storageKeys.currentUser);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 -mx-4 mb-5 border-b border-white/70 bg-sage-50/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-sage-700">HouseFlow</Link>
          <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-sm sm:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-sage-100 hover:text-sage-700">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-950">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <UserAvatar user={user} size="sm" />
            <button onClick={signOut} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
              Log out
            </button>
          </div>
        ) : (
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-700 shadow-sm">Log in</Link>
        )}
      </div>
    </header>
  );
}
