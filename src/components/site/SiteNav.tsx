"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, WavesHorizontal, X } from "lucide-react";
import { NAV } from "@/lib/site";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(path);
  // Close the menu when the route changes (adjusting state during render).
  if (open && openedAt !== path) {
    setOpen(false);
    setOpenedAt(path);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav aria-label="Main" className="hidden lg:block">
        <ul className="flex items-center gap-0.5">
          {NAV.filter((n) => n.href !== "/").map((n) => {
            const a = isActive(path, n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={a ? "page" : undefined}
                  className={`relative block rounded-lg px-2.5 py-2 text-[0.875rem] font-semibold no-underline transition-colors ${
                    a ? "text-accent" : "text-fg-2 hover:bg-panel-2 hover:text-fg"
                  }`}
                >
                  {n.label}
                  {a && <span aria-hidden className="absolute inset-x-2.5 -bottom-[13px] h-[2px] rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <button
        className="btn btn-ghost !min-h-9 !w-9 !p-0 lg:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => {
          setOpen((o) => !o);
          setOpenedAt(path);
        }}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-50 border-b border-line bg-elev shadow-[var(--shadow-lg)] lg:hidden">
          <ul className="mx-auto grid max-w-[1240px] gap-1 p-3 sm:grid-cols-2">
            {NAV.map((n) => {
              const a = isActive(path, n.href);
              const Icon = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={a ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline ${a ? "bg-accent-soft" : "hover:bg-panel-2"}`}
                  >
                    <span className="icon-tile !h-9 !w-9">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className={`block font-semibold ${a ? "text-accent" : "text-fg"}`}>{n.label}</span>
                      <span className="block text-xs text-muted">{n.desc}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

/** Header call to action; hidden on the simulator itself. */
export function LaunchCta() {
  const path = usePathname();
  if (path.startsWith("/simulator")) return null;
  return (
    <Link href="/simulator" className="btn btn-primary hidden !min-h-9 xl:inline-flex">
      <WavesHorizontal size={16} /> Launch simulator
    </Link>
  );
}
