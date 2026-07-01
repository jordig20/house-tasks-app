"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LoggedInUser } from "@/lib/auth";
import { getUserColorClass } from "@/lib/users";

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

export function BottomNav({ user }: { user: LoggedInUser | null }) {
  const pathname = usePathname();
  const navItems = user?.role === "admin" ? adminNavItems : memberNavItems;
  const gridCols =
    navItems.length === 4 ? "grid-cols-4" : "grid-cols-3";
  const userColor = user ? getUserColorClass(user.color, user.role) : "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      <div className={`mx-auto grid max-w-md gap-1 ${gridCols}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-2 py-2 text-center text-xs font-bold ${isActive ? "bg-cream-100 text-roof-800" : "text-slate-500"}`}
            >
              <span
                className={`mx-auto mb-1 block h-1.5 w-6 rounded-full ${isActive ? userColor || "bg-roof-800" : "bg-slate-200"}`}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
