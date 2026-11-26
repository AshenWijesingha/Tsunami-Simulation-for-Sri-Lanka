import Link from "next/link";
import { Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/site";

const COLS = [
  {
    t: "Platform",
    l: [
      ["/simulator", "Numerical simulator"],
      ["/learn", "12-chapter course"],
      ["/analysis", "Uncertainty analysis"],
      ["/exercises", "Exercises & quiz"],
    ],
  },
  {
    t: "Research",
    l: [
      ["/impact", "Impact & vulnerability"],
      ["/methods", "Methods & model card"],
      ["/references", "References & data"],
      ["/references#cite", "How to cite"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-elev">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div>
          <Logo size={40} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-2">{SITE.tagline}.</p>
          <p className="note mt-3">
            Version {SITE.version} ·{" "}
            <a href={SITE.repo} rel="noopener">
              open source on GitHub
            </a>
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.t} aria-label={c.t}>
            <h2 className="eyebrow mb-3">{c.t}</h2>
            <ul className="space-y-2 text-sm">
              {c.l.map(([h, l]) => (
                <li key={h}>
                  <Link href={h} className="text-fg-2 no-underline hover:text-accent">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="rounded-2xl border border-line bg-panel-2 p-4">
          <div className="flex items-center gap-2 font-semibold text-fg">
            <ShieldCheck size={18} className="text-coral" /> In an emergency
          </div>
          <p className="mt-2 text-sm text-fg-2">This is a research and teaching platform, not a warning service. Follow official instructions.</p>
          <dl className="mt-3 grid gap-2 text-sm">
            {[
              ["Disaster Management Centre", "117"],
              ["Department of Meteorology", "+94 11 268 6686"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <Phone size={14} className="mt-1 flex-none text-muted" aria-hidden />
                <div>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-bold text-fg">{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1240px] px-4 py-4 text-xs text-muted">
          © 2026 {SITE.name} contributors. Map data © OpenStreetMap contributors (ODbL) · OpenFreeMap · Sentinel-2 cloudless by EOX (CC BY 4.0) · Terrain:
          Tilezen/Mapzen on AWS Open Data (ETOPO1, SRTM).
        </p>
      </div>
    </footer>
  );
}
