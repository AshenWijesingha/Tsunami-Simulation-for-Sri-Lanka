import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { LaunchCta, SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg-elev)_86%,transparent)] backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4">
        <Link href="/" className="no-underline" aria-label="Tsunami Lab home">
          <Logo size={36} />
        </Link>
        <div className="flex items-center gap-1.5">
          <Suspense fallback={null}>
            <SiteNav />
          </Suspense>
          <ThemeToggle />
          <Suspense fallback={null}>
            <LaunchCta />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
