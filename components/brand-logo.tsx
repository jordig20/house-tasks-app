import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700/30">
      <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-cream-100 shadow-sm ring-1 ring-amber-900/10">
        <Image src="/540a-house-logo.svg" alt="540A Cleaning house logo" fill className="object-cover" priority />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-lg font-black tracking-tight text-amber-950">540A Cleaning</span>
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-olive-700">House tasks</span>
        </span>
      ) : null}
    </Link>
  );
}
