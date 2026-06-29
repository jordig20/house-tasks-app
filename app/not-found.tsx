import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 text-center">
      <section className="rounded-[2rem] bg-white p-8 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-roof-800">404</p>
        <h1 className="mt-2 text-3xl font-black">Room not found</h1>
        <p className="mt-2 text-slate-600">This page is not on the chore chart yet.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-roof-800 px-5 py-3 font-bold text-white">Go home</Link>
      </section>
    </main>
  );
}
