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
  { href: "/admin/calendar", label: "Print" },
  { href: "/admin/users", label: "Users" },
];

export function BottomNav({ user }: { user: LoggedInUser | null }) {
  const pathname = usePathname();
  const navItems = user?.role === "admin" ? adminNavItems : memberNavItems;
  const gridCols =
    navItems.length === 5 ? "grid-cols-5" : "grid-cols-3";
  const userColor = user ? getUserColorClass(user.color, user.role) : "";

  return (
    <nav aria-label="Primary navigation" className="print-hidden fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(15,23,42,0.1)] sm:hidden">
      <div className={`mx-auto grid max-w-md gap-1 ${gridCols}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-11 rounded-xl px-2 py-2 text-center font-ui text-xs font-bold transition ${isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <span
                className={`mx-auto mb-1 block h-1.5 w-6 rounded-full ${isActive ? userColor || "bg-cyan-300" : "bg-slate-200"}`}
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
