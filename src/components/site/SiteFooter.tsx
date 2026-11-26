import Link from "@/i18n/Link";
import { Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/site";
import { fmt, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

export function SiteFooter({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const f = d.footer;
  const cols = [
    {
      t: f.platform,
      l: [
        ["/simulator", f.links.simulator],
        ["/learn", f.links.course],
        ["/analysis", f.links.analysis],
        ["/exercises", f.links.exercises],
      ],
    },
    {
      t: f.research,
      l: [
        ["/impact", f.links.impact],
        ["/methods", f.links.methods],
        ["/references", f.links.references],
        ["/references#cite", f.links.cite],
      ],
    },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-elev">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div>
          <Logo size={40} region={d.meta.region} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-2">{d.meta.tagline}.</p>
          <p className="note mt-3">
            {fmt(f.version, { v: SITE.version })} ·{" "}
            <a href={SITE.repo} rel="noopener">
              {f.openSource}
            </a>
          </p>
        </div>
        {cols.map((c) => (
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
            <ShieldCheck size={18} className="text-coral" /> {f.emergencyTitle}
          </div>
          <p className="mt-2 text-sm text-fg-2">{f.emergencyText}</p>
          <dl className="mt-3 grid gap-2 text-sm">
            {[
              [f.dmc, "117"],
              [f.met, "+94 11 268 6686"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <Phone size={14} className="mt-1 flex-none text-muted" aria-hidden />
                <div>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-bold text-fg">
                    <a href={`tel:${v.replace(/\s/g, "")}`} className="text-fg no-underline">
                      {v}
                    </a>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1240px] px-4 py-4 text-xs text-muted">
          {f.rights} Map data © OpenStreetMap contributors (ODbL) · OpenFreeMap · Sentinel-2 cloudless by EOX (CC BY 4.0) · Terrain: Tilezen/Mapzen on AWS
          Open Data (ETOPO1, SRTM) · Coastlines: Natural Earth.
        </p>
      </div>
    </footer>
  );
}
