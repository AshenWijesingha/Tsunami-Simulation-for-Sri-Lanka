"use client";
import Link from "@/i18n/Link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { NAV } from "@/lib/site";
import { useT } from "@/i18n/client";

/** 404 content; reads the language from context so it works under every root layout. */
export function NotFoundView() {
  const t = useT();
  return (
    <div className="hero-bg border-b border-line">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <LogoMark size={56} className="mx-auto" />
        <div className="eyebrow mt-6 !text-accent">{t.notFound.eyebrow}</div>
        <h1 className="font-display mt-2 text-4xl font-semibold text-fg">{t.notFound.title}</h1>
        <p className="mt-3 text-fg-2">{t.notFound.text}</p>
        <ul className="mx-auto mt-8 grid max-w-lg gap-2 text-left sm:grid-cols-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link href={n.href} className="card card-hover flex items-center gap-3 p-3 no-underline">
                  <span className="icon-tile !h-9 !w-9">
                    <Icon size={17} />
                  </span>
                  <span className="font-semibold text-fg">{t.nav.items[n.key][0]}</span>
                  <ArrowRight size={15} className="ml-auto text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
