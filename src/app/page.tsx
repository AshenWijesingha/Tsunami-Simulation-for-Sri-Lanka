import Link from "next/link";
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

export const metadata: Metadata = pageMetadata({
  title: "Tsunami Lab: Indian Ocean tsunami simulator & course for Sri Lanka",
  absoluteTitle: true,
  description:
    "Simulate Indian Ocean tsunamis in your browser, learn the science in a free 12-chapter course, and explore uncertainty and coastal impact for Sri Lanka.",
  path: "/",
  og: "home",
});

const PATH = [
  { n: "01", t: "Learn", d: "Twelve chapters take you from the bulletin to the equations, dispersion and shoaling.", href: "/learn", icon: GraduationCap },
  { n: "02", t: "Simulate", d: "Run the shallow-water model for the real event, your own source, or the 2004 tsunami.", href: "/simulator", icon: WavesHorizontal },
  { n: "03", t: "Analyse", d: "Stress-test the forecast with sensitivity charts and a reproducible Monte Carlo.", href: "/analysis", icon: ChartSpline },
  { n: "04", t: "Assess impact", d: "Turn wave heights into exposure and damage, and see what 2004 taught us.", href: "/impact", icon: BookOpen },
];

const FEATURES = [
  { href: "/simulator", t: "Numerical simulator", d: "Linear shallow-water model on a spherical C-grid, computed in a background thread. 21 Sri Lankan and 8 regional gauges, ETOPO1 bathymetry.", icon: WavesHorizontal },
  { href: "/learn", t: "12-chapter course", d: "Graduate-level text with typeset equations and live model values. Every chapter sets up the simulator for you.", icon: GraduationCap },
  { href: "/analysis", t: "Uncertainty analysis", d: "Empirical decay laws, travel times, dispersion, sensitivity and a seeded Monte Carlo you can reconfigure.", icon: ChartSpline },
  { href: "/impact", t: "Impact & vulnerability", d: "The 2004 record with sources, vulnerability research, warning since 2004 and a fragility-based impact explorer.", icon: BookOpen },
  { href: "/methods", t: "Methods & model card", d: "Equations, numerics, verification tests, validation and limitations, documented for peer review.", icon: FlaskConical },
  { href: "/exercises", t: "Exercises", d: "Predict and verify, make the call at t + 65 min, beat the forecaster challenge, and take the concept quiz.", icon: FileText },
];

const TRUST = ["Free, no sign-up", "Runs in your browser", "Open source", "Verified physics", "Citable"];

export default function Home() {
  const src = buildSource(DEFAULT_PARAMS);
  const d = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);
  const H81 = abe81(d, src.Mt),
    H89 = abe89(d, src.Mt);
  const sens = sensitivitySpec(d, 6.5);
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero-bg relative overflow-hidden border-b border-line">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <Container className="relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="chip !border-[color-mix(in_srgb,var(--accent)_35%,transparent)] !bg-accent-soft !text-accent">
              <Landmark size={14} aria-hidden /> Open research & teaching platform
            </span>
            <h1 className="font-display mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-fg sm:text-5xl lg:text-[3.6rem]">
              How dangerous is a distant earthquake to Sri&nbsp;Lanka&apos;s coast?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-2">
              Simulate Indian Ocean tsunamis in your browser, learn the science behind a real warning decision, and explore what wave heights mean for
              the people and places on the coast.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/simulator" className="btn btn-primary btn-lg">
                <WavesHorizontal size={18} /> Launch the simulator
              </Link>
              <Link href="/learn" className="btn btn-lg">
                <GraduationCap size={18} /> Start the course
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-2">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CircleCheck size={15} className="text-ok" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* ---------- case study ---------- */}
      <Container className="py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Case study</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ok">
                <span className="h-2 w-2 rounded-full bg-current" /> No tsunami threat
              </span>
            </div>
            <h2 className="font-display mt-3 text-[1.7rem] font-semibold leading-tight text-fg">M6.5 Mauritius–Réunion region, 24 November 2026</h2>
            <p className="mt-3 leading-relaxed text-fg-2">
              At 16:36 Sri Lanka time a shallow M6.5 earthquake struck the Central Indian Ridge, about {Math.round(d).toLocaleString()} km away. Sixty-five
              minutes later the Department of Meteorology issued Bulletin No. 02: <b className="text-fg">no tsunami threat</b>. This platform reconstructs
              the science behind that call and asks how confident it could be.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Stat icon={Ruler} value={`${Math.round(d).toLocaleString()} km`} label="Distance" sub="epicentre to Dondra Head" />
              <Stat icon={Clock} value={fmtDur(d / C_KMMIN)} label="Travel time" sub="long-wave, h = 4 km" />
              <Stat icon={MapPin} value={fmtLen(H89)} label="Empirical run-up" sub="Abe (1989), normal fault" />
              <Stat icon={Sigma} value={`M${mwForHeight(0.3, d, "thrust").toFixed(1)}`} label="Needed for 0.3 m" sub="even for thrust faulting" />
            </div>
            <p className="note mt-4">
              Tide-gauge amplitude by Abe (1981): {fmtLen(H81)}. Numerical results, synthetic gauges and full uncertainty analysis in the{" "}
              <Link href="/simulator">simulator</Link> and <Link href="/analysis">analysis</Link>.
            </p>
          </article>
          <figure className="card flex flex-col p-5 md:p-6">
            <figcaption className="mb-3">
              <div className="eyebrow">Key result</div>
              <div className="mt-1 text-lg font-bold text-fg">Run-up at Sri Lanka versus magnitude and mechanism</div>
            </figcaption>
            <Chart {...sens} height={380} />
            <p className="note mt-3">
              From the bulletin epicentre, only a thrust event above about M8.5 would reach the 0.3 m information threshold. The Central Indian Ridge hosts
              normal and strike-slip faulting, not large thrusts.
            </p>
          </figure>
        </div>
      </Container>

      {/* ---------- learning path ---------- */}
      <section className="border-y border-line bg-elev py-16 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="How to use it"
            title="A learning path from first principles to impact"
            lead="Work through it in order as a course, or jump straight to the tool you need. Every step links to the others."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PATH.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.n}>
                  <Link href={p.href} className="card card-hover group flex h-full flex-col p-5 no-underline">
                    <div className="flex items-center justify-between">
                      <span className="icon-tile">
                        <Icon size={20} />
                      </span>
                      <span className="font-display text-3xl font-semibold text-line-strong">{p.n}</span>
                    </div>
                    <div className="mt-4 text-lg font-bold text-fg group-hover:text-accent">{p.t}</div>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-2">{p.d}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
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
        <SectionHeading eyebrow="What's inside" title="Everything you need to study far-field tsunami hazard" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.href} href={f.href} className="card card-hover group block p-6 no-underline">
                <span className="icon-tile">
                  <Icon size={20} />
                </span>
                <div className="mt-4 flex items-center gap-1.5 text-lg font-bold text-fg group-hover:text-accent">
                  {f.t} <ArrowRight size={16} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{f.d}</p>
              </Link>
            );
          })}
        </div>

        {/* ---------- why it matters ---------- */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <article className="card p-6 md:p-8 lg:col-span-2">
            <div className="eyebrow">Why it matters</div>
            <h2 className="font-display mt-2 text-[1.7rem] font-semibold leading-tight text-fg">Sri Lanka and the 2004 Indian Ocean tsunami</h2>
            <p className="mt-3 leading-relaxed text-fg-2">
              On 26 December 2004 a Mw 9.1 earthquake off Sumatra sent waves across the Bay of Bengal that reached Sri Lanka about two hours later, with
              no warning. More than 31,000 people were killed and thousands more were never found; roughly two-thirds of the coastline was affected and
              several hundred thousand people were displaced.
            </p>
            <p className="mt-3 leading-relaxed text-fg-2">
              Far-field warnings now depend on getting two things right quickly: <b className="text-fg">which events are dangerous</b>, and{" "}
              <b className="text-fg">which are not</b>. Over-warning erodes trust and costs livelihoods; under-warning costs lives. This platform is built
              around that decision.
            </p>
            <Link href="/impact" className="btn mt-5">
              Read the impact review <ArrowRight size={16} />
            </Link>
          </article>
          <aside className="card p-6 md:p-8">
            <div className="eyebrow">Research-grade by design</div>
            <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
              {[
                "Open equations, numerics and assumptions",
                "Automated verification tests of the physics",
                "Validated against the 2004 event",
                "Seeded, reproducible Monte Carlo",
                "Shareable permalinks for every scenario",
                "CSV, JSON, GIS grid and SVG exports",
                "Full references with DOIs",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <BadgeCheck size={17} className="mt-px flex-none text-accent" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <Link href="/methods" className="btn mt-5">
              Model card <ArrowRight size={16} />
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
            <h2 className="font-display text-[2rem] font-semibold leading-tight">Run your first tsunami simulation in under a minute</h2>
            <p className="mt-3 text-[1.05rem] text-[#cfe6f5]">No installation, no account. The model computes in your browser and every result can be shared and cited.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/simulator" className="btn btn-lg !border-white !bg-white !text-[#0A2463] hover:!brightness-95">
                <WavesHorizontal size={18} /> Launch the simulator
              </Link>
              <Link href="/learn/overview" className="btn btn-lg !border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                Read chapter 1 <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
        <div className="callout callout-warn mt-10">
          <b>Not an operational warning service.</b> Official tsunami warnings for Sri Lanka are issued by the Department of Meteorology; the Disaster
          Management Centre coordinates evacuation (hotline 117).
        </div>
      </Container>
    </>
  );
}
