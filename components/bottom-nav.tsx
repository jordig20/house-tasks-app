"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/today", label: "Today", icon: "☀️" },
  { href: "/week", label: "Week", icon: "🗓️" },
  { href: "/month", label: "Month", icon: "▦" },
  { href: "/history", label: "History", icon: "✅" },
  { href: "/admin/users", label: "Users", icon: "👥" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-2 py-2 text-center text-xs font-bold ${isActive ? "bg-cream-100 text-roof-800" : "text-slate-500"}`}
            >
              <span className="block text-lg" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
