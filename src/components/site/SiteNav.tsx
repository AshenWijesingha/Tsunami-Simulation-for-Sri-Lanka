"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/site";

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <>
      <nav aria-label="Main" className="hidden lg:flex items-center gap-0.5">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-2.5 py-1.5 rounded-lg text-[0.88rem] font-semibold no-underline transition-colors ${
              active(n.href) ? "bg-accent-soft text-accent" : "text-fg-2 hover:text-fg hover:bg-panel-2"
            }`}
            aria-current={active(n.href) ? "page" : undefined}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <button className="btn lg:hidden !px-2.5" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        ☰
      </button>
      {open && (
        <div className="lg:hidden absolute left-0 right-0 top-full border-b border-line bg-elev z-50 px-4 py-3 grid grid-cols-2 gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded-lg font-semibold no-underline ${active(n.href) ? "bg-accent-soft text-accent" : "text-fg-2"}`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
