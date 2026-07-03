import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400/40">
      <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
        <Image
          src="/540A_logo.png"
          alt="540A Cleaning house logo"
          fill
          sizes="48px"
          className="object-cover"
          priority
        />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold tracking-tight text-slate-950">540A Cleaning</span>
          <span className="block font-ui text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">House tasks</span>
        </span>
      ) : null}
    </Link>
  );
}
