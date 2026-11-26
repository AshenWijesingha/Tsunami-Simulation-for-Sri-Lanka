import Link from "@/i18n/Link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";
import { LaunchCta, SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg-elev)_86%,transparent)] backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4">
        <Link href="/" className="min-w-0 no-underline" aria-label={d.nav.homeAria}>
          <Logo size={36} region={d.meta.region} />
        </Link>
        <div className="flex items-center gap-1">
          <Suspense fallback={null}>
            <SiteNav />
          </Suspense>
          <Suspense fallback={null}>
            <LanguageSwitcher />
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
