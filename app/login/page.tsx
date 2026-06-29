import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft">
        <Link href="/" className="text-sm font-bold text-sage-700">← HouseFlow</Link>
        <h1 className="mt-8 text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-slate-600">Authentication will be added later. For now, jump into the mock dashboard.</p>
        <form className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email address" type="email" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" />
          <Link href="/today" className="block rounded-full bg-sage-700 px-5 py-3 text-center font-bold text-white">Continue</Link>
        </form>
      </section>
    </main>
  );
}
