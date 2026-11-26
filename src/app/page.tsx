import Link from "next/link";
import { Container, Stat } from "@/components/ui/PageHeader";
import { Chart } from "@/components/charts/Chart";
import { sensitivitySpec } from "@/components/analysis/specs";
import { C_KMMIN, DONDRA, EPI } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, DEFAULT_PARAMS, mwForHeight } from "@/lib/physics/source";
import { fmtDur, fmtLen } from "@/lib/format";

const FEATURES = [
  { href: "/simulator", t: "Numerical simulator", d: "Linear shallow-water model of the Indian Ocean on a spherical C-grid, computed in your browser in a background thread. 21 Sri Lankan coastal gauges, 8 regional gauges, ETOPO1 bathymetry.", k: "Model" },
  { href: "/learn", t: "12-chapter course", d: "From the bulletin to the equations, dispersion, shoaling, validation and research directions. Each chapter sets up the simulator for you.", k: "Learn" },
  { href: "/analysis", t: "Uncertainty analysis", d: "Empirical decay laws, travel times, dispersion, sensitivity to magnitude and mechanism, and a seeded Monte Carlo you can reconfigure.", k: "Analyse" },
  { href: "/impact", t: "Impact & vulnerability", d: "What the 2004 tsunami did to Sri Lanka, what research learned about why, how warning has changed since, and a fragility-based impact calculator.", k: "Impact" },
  { href: "/methods", t: "Methods & model card", d: "Equations, numerics, verification tests, validation, limitations and intended use, documented for peer review.", k: "Methods" },
  { href: "/exercises", t: "Exercises", d: "Predict and verify, make the operational call at t + 65 min, the forecaster challenge, and a graduate-level concept quiz.", k: "Practice" },
];

export default function Home() {
  const src = buildSource(DEFAULT_PARAMS);
  const d = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);
  const H81 = abe81(d, src.Mt),
    H89 = abe89(d, src.Mt);
  const sens = sensitivitySpec(d, 6.5);
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-elev">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(1200px_500px_at_85%_-10%,var(--accent-soft),transparent_60%),radial-gradient(800px_400px_at_0%_110%,color-mix(in_srgb,var(--accent-2)_12%,transparent),transparent_60%)]" />
        <Container className="relative py-14 md:py-20">
          <div className="eyebrow text-accent">Open research platform · Indian Ocean · Sri Lanka</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-fg md:text-6xl text-balance">
            How dangerous is a distant earthquake to Sri Lanka&apos;s coast?
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-2 text-pretty">
            A reproducible, browser-based tool for far-field tsunami hazard research and teaching. It pairs a numerical shallow-water model with
            empirical forecasts and uncertainty analysis, validates against the 2004 Indian Ocean tsunami, and sets the physics alongside the evidence on
            coastal impact.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href="/simulator" className="btn btn-primary !px-5 !py-2.5 !text-base">
              ▶ Open the simulator
            </Link>
            <Link href="/learn" className="btn !px-5 !py-2.5 !text-base">
              Start the course
            </Link>
            <Link href="/impact" className="btn !px-5 !py-2.5 !text-base">
              Impact research
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Case study</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--ok)_50%,transparent)] bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-ok">
                <span className="h-2 w-2 rounded-full bg-current" /> No tsunami threat
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-fg">M6.5 Mauritius–Réunion region, 24 November 2026</h2>
            <p className="mt-2 text-fg-2">
              At 16:36 Sri Lanka time a shallow M6.5 earthquake struck the Central Indian Ridge, about {Math.round(d).toLocaleString()} km from Sri Lanka.
              Sixty-five minutes later the Department of Meteorology issued Bulletin No. 02: <b>no tsunami threat</b>. This platform reconstructs the
              science behind that call and asks how confident it could be.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat value={`${Math.round(d).toLocaleString()} km`} label="Distance" sub="to Dondra Head" />
              <Stat value={fmtDur(d / C_KMMIN)} label="Travel time" sub="long-wave, h = 4 km" />
              <Stat value={fmtLen(H89)} label="Empirical run-up" sub="Abe (1989), normal fault" />
              <Stat value={`M${mwForHeight(0.3, d, "thrust").toFixed(1)}`} label="Needed for 0.3 m" sub="even for thrust" />
            </div>
            <p className="note mt-4">
              Tide-gauge amplitude by Abe (1981): {fmtLen(H81)}. Numerical model, gauge records and full uncertainty analysis in the{" "}
              <Link href="/simulator">simulator</Link> and <Link href="/analysis">analysis</Link> pages.
            </p>
          </div>
          <figure className="card p-4">
            <figcaption className="mb-2 font-bold text-fg">Run-up at Sri Lanka versus magnitude and mechanism</figcaption>
            <Chart {...sens} height={380} />
            <p className="note mt-2">
              From the bulletin epicentre, only a thrust event above about M8.5 would reach the 0.3 m information threshold. The Central Indian Ridge hosts
              normal and strike-slip faulting, not large thrusts.
            </p>
          </figure>
        </div>

        <h2 className="mt-16 text-2xl font-extrabold text-fg">What you can do here</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="card group block p-5 no-underline transition-colors hover:border-accent">
              <div className="eyebrow text-accent">{f.k}</div>
              <div className="mt-1.5 text-lg font-bold text-fg group-hover:text-accent">{f.t} →</div>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{f.d}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="eyebrow">Why it matters</div>
            <h2 className="mt-1.5 text-2xl font-bold text-fg">Sri Lanka and the 2004 Indian Ocean tsunami</h2>
            <p className="mt-2 text-fg-2">
              On 26 December 2004 a Mw 9.1 earthquake off Sumatra sent waves across the Bay of Bengal that reached Sri Lanka about two hours later, with no
              warning. More than 31,000 people were killed and thousands more were never found; roughly two-thirds of the coastline was affected and
              several hundred thousand people were displaced. The disaster reshaped tsunami science, warning systems and coastal policy across the Indian
              Ocean.
            </p>
            <p className="mt-2 text-fg-2">
              Far-field warnings now depend on getting two things right quickly: <b>which events are dangerous</b>, and <b>which are not</b>. Over-warning
              erodes trust and costs livelihoods; under-warning costs lives. This platform is built around that decision.
            </p>
            <Link href="/impact" className="btn mt-4">
              Read the impact review →
            </Link>
          </div>
          <div className="card p-6">
            <div className="eyebrow">Research-grade by design</div>
            <ul className="mt-3 space-y-2 text-sm text-fg-2">
              <li>✓ Open equations, numerics and assumptions</li>
              <li>✓ Automated verification tests of the physics</li>
              <li>✓ Validation against the 2004 event</li>
              <li>✓ Seeded, reproducible Monte Carlo</li>
              <li>✓ Shareable permalinks for every scenario</li>
              <li>✓ Data export: CSV, JSON, ESRI ASCII grids, SVG figures</li>
              <li>✓ Citable, with full references and DOIs</li>
            </ul>
            <Link href="/methods" className="btn mt-4">
              Model card →
            </Link>
          </div>
        </div>

        <div className="callout callout-warn mt-10">
          <b>Not an operational warning service.</b> This is a research and teaching platform. Official tsunami warnings for Sri Lanka are issued by the
          Department of Meteorology; the Disaster Management Centre coordinates evacuation (hotline 117).
        </div>
      </Container>
    </>
  );
}
