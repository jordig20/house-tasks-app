import { AppShell } from "@/components/app-shell";
import { housemates } from "@/lib/tasks";

export default function UsersPage() {
  return (
    <AppShell eyebrow="Admin" title="Housemates">
      <div className="grid gap-4 sm:grid-cols-2">
        {housemates.map((user) => (
          <article key={user.name} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-lg font-black text-sage-700">
                {user.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-black">{user.name}</h2>
                <p className="text-sm text-slate-600">{user.role}</p>
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-sage-50 p-3 text-sm text-slate-700">
              <strong className="text-slate-950">{user.completed}</strong> tasks completed this month
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
