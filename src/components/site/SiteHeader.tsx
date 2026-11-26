import Link from "next/link";
import { Suspense } from "react";
import { SITE } from "@/lib/site";
import { SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f6feb" />
          <stop offset="1" stopColor="#4cc9f0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lg)" />
      <path d="M4 20c3 0 4-3 7-3s4 3 7 3 4-3 7-3 3 2 3 2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 25c3 0 4-3 7-3s4 3 7 3 4-3 7-3 3 2 3 2" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="10" r="3" fill="#ffd166" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg-elev)_92%,transparent)] backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline min-w-0">
          <Logo />
          <span className="min-w-0">
            <span className="block text-[0.95rem] font-extrabold leading-tight text-fg truncate">{SITE.name}</span>
            <span className="hidden sm:block text-[0.72rem] leading-tight text-muted truncate">Far-field hazard · Sri Lanka</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Suspense fallback={null}>
            <SiteNav />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
