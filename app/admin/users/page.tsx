import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { mockUsers } from "@/lib/tasks";

export default function UsersPage() {
  return (
    <AppShell eyebrow="Admin" title="House members" requireAdmin>
      <div className="grid gap-4 sm:grid-cols-2">
        {mockUsers.map((user) => (
          <article key={user.id} className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div>
                <h2 className="text-lg font-black">{user.name}</h2>
                <p className="text-sm capitalize text-slate-600">{user.role}</p>
              </div>
            </div>
            <p className="mt-4 rounded-2xl bg-sage-50 p-3 text-sm text-slate-700">
              Mock PIN: <strong className="text-slate-950">{user.pin}</strong>
            </p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border-2 border-dashed border-sage-200 bg-white/70 p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sage-700">Mockup</p>
        <h2 className="mt-2 text-xl font-black">Add a house member</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input disabled className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Name" />
          <input disabled className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="PIN" />
          <button disabled className="rounded-full bg-slate-200 px-4 py-3 font-black text-slate-500">Add later</button>
        </div>
        <p className="mt-3 text-sm text-slate-500">User creation will connect to a database later. For now, this is only a UI placeholder.</p>
      </section>
    </AppShell>
  );
}
