import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { TaskCard } from "@/components/task-card";
import { getTodayTasks } from "@/lib/tasks";

export default function Home() {
  const previewTasks = getTodayTasks().slice(0, 2);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff1d1,transparent_32%),radial-gradient(circle_at_bottom_right,#eaf1db,transparent_35%),#fffaf0] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-between gap-10">
        <nav className="flex items-center justify-between">
          <BrandLogo />
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-roof-800 shadow-sm ring-1 ring-amber-900/10">Log in</Link>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-roof-800 shadow-sm ring-1 ring-amber-900/10">
              540A house cleaning, without the group-chat chaos
            </p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-amber-950 sm:text-6xl">
              A calmer way to keep 540A clean.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
              540A Cleaning helps Jordi, Rafa, and Alex see today&apos;s chores, mark tasks done, and keep a local history before calendar and database integrations arrive.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-full bg-roof-800 px-6 py-3 text-center font-bold text-white shadow-soft">Start with mock login</Link>
              <Link href="/week" className="rounded-full bg-white px-6 py-3 text-center font-bold text-roof-800 shadow-sm ring-1 ring-amber-900/10">Preview the week</Link>
            </div>
          </div>

          <div className="relative rounded-[2rem] bg-white/85 p-4 shadow-soft ring-1 ring-amber-900/10 backdrop-blur">
            <div className="absolute -right-3 -top-5 hidden rounded-[2rem] bg-olive-100 p-3 shadow-sm sm:block">
              <Image src="/540a-house-logo.svg" alt="540A house illustration" width={116} height={116} className="rounded-3xl" priority />
            </div>
            <div className="mb-4 flex items-center justify-between px-2 sm:pr-28">
              <div>
                <p className="text-sm font-bold text-olive-700">Today at 540A</p>
                <h2 className="text-2xl font-black text-amber-950">Shared checklist</h2>
              </div>
              <span className="rounded-full bg-terracotta/15 px-3 py-1 text-sm font-bold text-roof-800">Local MVP</span>
            </div>
            <div className="space-y-3">
              {previewTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 pb-4 text-sm text-slate-600 sm:grid-cols-3">
          <p className="rounded-2xl bg-white/75 p-4 ring-1 ring-amber-900/10"><strong className="text-amber-950">Mock login:</strong> pick Jordi, Rafa, or Alex and enter a PIN.</p>
          <p className="rounded-2xl bg-white/75 p-4 ring-1 ring-amber-900/10"><strong className="text-amber-950">Local status:</strong> task updates are stored in localStorage for now.</p>
          <p className="rounded-2xl bg-white/75 p-4 ring-1 ring-amber-900/10"><strong className="text-amber-950">Future-ready:</strong> calendar and database integrations come later.</p>
        </div>
      </section>
    </main>
  );
}
