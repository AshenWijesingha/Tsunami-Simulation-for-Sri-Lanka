import Link from "@/i18n/Link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChartSpline,
  CircleCheck,
  Clock,
  FileText,
  FlaskConical,
  GraduationCap,
  Landmark,
  MapPin,
  Ruler,
  Sigma,
  WavesHorizontal,
} from "lucide-react";
import { Container, SectionHeading, Stat } from "@/components/ui/PageHeader";
import { HeroVisual } from "@/components/brand/HeroVisual";
import { Chart } from "@/components/charts/Chart";
import { sensitivitySpec } from "@/components/analysis/specs";
import { C_KMMIN, DONDRA, EPI } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, DEFAULT_PARAMS, mwForHeight } from "@/lib/physics/source";
import { fmtDur, fmtLen } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { fmt, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

export function homeMetadata(locale: Locale): Metadata {
  const m = getDict(locale).meta.pages.home;
  return pageMetadata({ locale, title: m.title, description: m.description, path: "/", og: "home", absoluteTitle: true });
}

const PATH = [
  { href: "/learn", icon: GraduationCap },
  { href: "/simulator", icon: WavesHorizontal },
  { href: "/analysis", icon: ChartSpline },
  { href: "/impact", icon: BookOpen },
];
const FEATURES = [
  { href: "/simulator", icon: WavesHorizontal },
  { href: "/learn", icon: GraduationCap },
  { href: "/analysis", icon: ChartSpline },
  { href: "/impact", icon: BookOpen },
  { href: "/methods", icon: FlaskConical },
  { href: "/exercises", icon: FileText },
];

export function HomeView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const h = t.home;
  const src = buildSource(DEFAULT_PARAMS);
  const d = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);
  const H81 = abe81(d, src.Mt),
    H89 = abe89(d, src.Mt);
  const sens = sensitivitySpec(d, 6.5, h.chart);
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero-bg relative overflow-hidden border-b border-line">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <Container className="relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div className="min-w-0">
            <span className="chip !border-[color-mix(in_srgb,var(--accent)_35%,transparent)] !bg-accent-soft !text-accent">
              <Landmark size={14} aria-hidden /> {h.chip}
            </span>
            <h1 className="font-display mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-fg sm:text-5xl lg:text-[3.6rem]">{h.h1}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-2">{h.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulator" className="btn btn-primary btn-lg">
                <WavesHorizontal size={18} /> {h.ctaSim}
              </Link>
              <Link href="/learn" className="btn btn-lg">
                <GraduationCap size={18} /> {h.ctaCourse}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2">
              {h.trust.map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <CircleCheck size={15} className="text-ok" aria-hidden /> {x}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual labels={h.hero} />
        </Container>
      </section>

      {/* ---------- case study ---------- */}
      <Container className="py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{h.caseStudy}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ok">
                <span className="h-2 w-2 rounded-full bg-current" /> {h.noThreat}
              </span>
            </div>
            <h2 className="font-display mt-3 text-[1.7rem] font-semibold leading-tight text-fg">{h.caseTitle}</h2>
            <p className="mt-3 leading-relaxed text-fg-2">
              {fmt(h.caseA, { d: Math.round(d).toLocaleString("en-US") })} <b className="text-fg">{h.caseBold}</b>
              {h.caseB}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Stat icon={Ruler} value={`${Math.round(d).toLocaleString("en-US")} km`} label={h.stats.distance[0]} sub={h.stats.distance[1]} />
              <Stat icon={Clock} value={fmtDur(d / C_KMMIN)} label={h.stats.travel[0]} sub={h.stats.travel[1]} />
              <Stat icon={MapPin} value={fmtLen(H89)} label={h.stats.runup[0]} sub={h.stats.runup[1]} />
              <Stat icon={Sigma} value={`M${mwForHeight(0.3, d, "thrust").toFixed(1)}`} label={h.stats.needed[0]} sub={h.stats.needed[1]} />
            </div>
            <p className="note mt-4">
              {fmt(h.tideNote, { h: fmtLen(H81) })} <Link href="/simulator">{t.nav.items.simulator[0]}</Link> ·{" "}
              <Link href="/analysis">{t.nav.items.analysis[0]}</Link>
            </p>
          </article>
          <figure className="card flex flex-col p-5 md:p-6">
            <figcaption className="mb-3">
              <div className="eyebrow">{h.keyResult}</div>
              <div className="mt-1 text-lg font-bold text-fg">{h.keyTitle}</div>
            </figcaption>
            <Chart {...sens} height={380} />
            <p className="note mt-3">{h.keyNote}</p>
          </figure>
        </div>
      </Container>

      {/* ---------- learning path ---------- */}
      <section className="border-y border-line bg-elev py-16 md:py-20">
        <Container>
          <SectionHeading eyebrow={h.pathEyebrow} title={h.pathTitle} lead={h.pathLead} />
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PATH.map((p, i) => {
              const Icon = p.icon;
              return (
                <li key={p.href}>
                  <Link href={p.href} className="card card-hover group flex h-full flex-col p-5 no-underline">
                    <div className="flex items-center justify-between">
                      <span className="icon-tile">
                        <Icon size={20} />
                      </span>
                      <span className="font-display text-3xl font-semibold text-line-strong">0{i + 1}</span>
                    </div>
                    <div className="mt-4 text-lg font-bold text-fg group-hover:text-accent">{h.path[i][0]}</div>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-2">{h.path[i][1]}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      {t.common.open} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      {/* ---------- features ---------- */}
      <Container className="py-16 md:py-20">
        <SectionHeading eyebrow={h.featuresEyebrow} title={h.featuresTitle} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Link key={f.href} href={f.href} className="card card-hover group block p-6 no-underline">
                <span className="icon-tile">
                  <Icon size={20} />
                </span>
                <div className="mt-4 flex items-center gap-1.5 text-lg font-bold text-fg group-hover:text-accent">
                  {h.features[i][0]} <ArrowRight size={16} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{h.features[i][1]}</p>
              </Link>
            );
          })}
        </div>

        {/* ---------- why it matters ---------- */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <article className="card p-6 md:p-8 lg:col-span-2">
            <div className="eyebrow">{h.whyEyebrow}</div>
            <h2 className="font-display mt-2 text-[1.7rem] font-semibold leading-tight text-fg">{h.whyTitle}</h2>
            <p className="mt-3 leading-relaxed text-fg-2">{h.whyP1}</p>
            <p className="mt-3 leading-relaxed text-fg-2">{h.whyP2}</p>
            <Link href="/impact" className="btn mt-5">
              {h.whyCta} <ArrowRight size={16} />
            </Link>
          </article>
          <aside className="card p-6 md:p-8">
            <div className="eyebrow">{h.researchEyebrow}</div>
            <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
              {h.research.map((x) => (
                <li key={x} className="flex gap-2">
                  <BadgeCheck size={17} className="mt-px flex-none text-accent" aria-hidden /> {x}
                </li>
              ))}
            </ul>
            <Link href="/methods" className="btn mt-5">
              {h.researchCta} <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </Container>

      {/* ---------- call to action ---------- */}
      <Container>
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#071a47,#0A2463_45%,#0B5394)] px-6 py-12 text-white md:px-12 md:py-14">
          <svg aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] opacity-25" viewBox="0 0 400 400">
            {[60, 110, 160, 210].map((r) => (
              <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#9ADCF2" strokeWidth="2" />
            ))}
          </svg>
          <div className="relative max-w-2xl">
            <h2 className="font-display text-[2rem] font-semibold leading-tight">{h.ctaTitle}</h2>
            <p className="mt-3 text-[1.05rem] text-[#cfe6f5]">{h.ctaLead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/simulator" className="btn btn-lg !border-white !bg-white !text-[#0A2463] hover:!brightness-95">
                <WavesHorizontal size={18} /> {h.ctaSim}
              </Link>
              <Link href="/learn/overview" className="btn btn-lg !border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                {h.ctaChapter} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
        <div className="callout callout-warn mt-10">
          <b>{h.disclaimerBold}</b> {h.disclaimer}
        </div>
      </Container>
    </>
  );
}
