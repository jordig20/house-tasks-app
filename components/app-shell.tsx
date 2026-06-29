import Link from "next/link";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/history", label: "History" },
  { href: "/admin/users", label: "Users" },
];

export function AppShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return (
    <main className="min-h-screen bg-sage-50 px-4 py-5 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 flex items-center justify-between gap-3 rounded-full bg-white/90 p-2 shadow-sm">
          <Link href="/" className="rounded-full bg-sage-700 px-4 py-2 text-sm font-bold text-white">HouseFlow</Link>
          <div className="flex overflow-x-auto text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 hover:bg-sage-100 hover:text-sage-700">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <header className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sage-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
