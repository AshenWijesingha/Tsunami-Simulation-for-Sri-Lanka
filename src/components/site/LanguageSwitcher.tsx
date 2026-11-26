"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { LOCALES, LOCALE_INFO, localePath, stripLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

/** Switches language while staying on the same page. Each language has its own root layout, so this is a full page load. */
export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const path = stripLocale(usePathname() || "/");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        className="btn btn-ghost !min-h-9 gap-1.5 !px-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${dict.nav.language}: ${LOCALE_INFO[locale].label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Languages size={18} />
        <span className="hidden text-[0.82rem] sm:inline">{LOCALE_INFO[locale].label}</span>
      </button>
      {open && (
        <ul role="menu" className="card absolute right-0 top-full z-50 mt-2 w-48 p-1.5 shadow-[var(--shadow-lg)]">
          {LOCALES.map((l) => (
            <li key={l} role="none">
              <NextLink
                role="menuitem"
                href={localePath(l, path)}
                hrefLang={LOCALE_INFO[l].hreflang}
                lang={LOCALE_INFO[l].htmlLang}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm no-underline ${l === locale ? "bg-accent-soft font-semibold text-accent" : "text-fg hover:bg-panel-2"}`}
              >
                <span>
                  {LOCALE_INFO[l].label}
                  {l !== "en" && <span className="ml-1.5 text-xs text-muted">{LOCALE_INFO[l].english}</span>}
                </span>
                {l === locale && <Check size={15} />}
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
