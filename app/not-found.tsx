import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
      <section className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="font-ui text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Room not found</h1>
        <p className="mt-2 text-slate-600">This page is not on the chore chart yet.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 font-ui font-bold text-white">Go home</Link>
      </section>
    </main>
  );
}
