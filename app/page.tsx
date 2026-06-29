import Link from "next/link";
import { TaskCard } from "@/components/task-card";
import { getTodayTasks } from "@/lib/tasks";

export default function Home() {
  const previewTasks = getTodayTasks().slice(0, 2);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcebd7,transparent_35%),#f5f8f3] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-between gap-10">
        <nav className="flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-sage-700">HouseFlow</span>
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">Log in</Link>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-700 shadow-sm">
              Mobile-first chores without the group-chat chaos
            </p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Keep shared cleaning fair, visible, and easy.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
              A lightweight MVP for roommates to check today&apos;s chores, update status locally, and prepare for Google Calendar and Neon Postgres later.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-full bg-sage-700 px-6 py-3 text-center font-bold text-white shadow-soft">Start with mock login</Link>
              <Link href="/week" className="rounded-full bg-white px-6 py-3 text-center font-bold text-sage-700 shadow-sm">Preview the week</Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/80 p-4 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between px-2">
              <div>
                <p className="text-sm font-bold text-sage-700">Today</p>
                <h2 className="text-2xl font-black">Shared checklist</h2>
              </div>
              <span className="rounded-full bg-coral/20 px-3 py-1 text-sm font-bold text-orange-900">Local MVP</span>
            </div>
            <div className="space-y-3">
              {previewTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 pb-4 text-sm text-slate-600 sm:grid-cols-3">
          <p className="rounded-2xl bg-white/70 p-4"><strong className="text-slate-950">Mock login:</strong> pick Jordi, Rafa, or Alex and enter a PIN.</p>
          <p className="rounded-2xl bg-white/70 p-4"><strong className="text-slate-950">Local status:</strong> task updates are stored in localStorage for now.</p>
          <p className="rounded-2xl bg-white/70 p-4"><strong className="text-slate-950">Future-ready:</strong> calendar and database integrations come later.</p>
        </div>
      </section>
    </main>
  );
}
