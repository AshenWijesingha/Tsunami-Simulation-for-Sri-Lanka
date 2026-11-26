import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";
import { FlaskConical } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleLd, sectionMetadata } from "@/lib/seo";
import Link from "@/i18n/Link";
import { Container, EnglishOnlyNotice, PageHeader } from "@/components/ui/PageHeader";
import { Eq, M } from "@/components/ui/Tex";
import { TEX } from "@/content/equations";
import { DOM, H_PATH } from "@/lib/physics/constants";
import { MECH } from "@/lib/physics/source";
import { GAUGES, LEVELS, TOWNS } from "@/lib/physics/stations";
import { CFL, SPONGE_CELLS } from "@/lib/physics/solver";

export const methodsMetadata = (locale: Locale): Metadata => sectionMetadata(locale, "methods", "/methods", { type: "article", keywords: ["tsunami model", "shallow water equations numerical scheme", "model card", "tsunami model validation"] });

const TOC = [
  ["card", "Model card"],
  ["equations", "Governing equations"],
  ["numerics", "Numerical scheme"],
  ["source", "Source model"],
  ["coast", "Coastal estimates"],
  ["empirical", "Empirical model"],
  ["uq", "Uncertainty"],
  ["verification", "Verification"],
  ["validation", "Validation"],
  ["limits", "Limitations"],
  ["repro", "Reproducibility"],
] as const;

const TESTS = [
  ["Long-wave speed at 4 km depth", "√(gh) = 198.1 m/s"],
  ["Green's-law gain 4,000 → 10 m", "4.47"],
  ["Epicentre–Dondra Head distance", "3,000–3,150 km"],
  ["Scaling relations (L, W, M₀, Mₜ)", "Wells & Coppersmith (1994), Hanks & Kanamori (1979) exactly"],
  ["2004 source", "prescribed 1,300 × 150 km plane; kh < 0.1 (non-dispersive)"],
  ["Abe (1989) / Abe (1981) ratio", "10^0.25"],
  ["Magnitude for 0.3 m at 3,090 km (thrust)", "≈ M8.5"],
  ["Analytic model, actual event", "Ht < 1 cm at all 21 stations; no-threat level"],
  ["Island shelter logic", "east coast sheltered for western sources, not the south-west"],
  ["Dispersion limits", "c/c₀ and c_g/c₀ → 1 as kh → 0; c_g < c for finite kh"],
  ["Monte Carlo", "bit-identical results for a fixed seed"],
  ["Solver set-up (10′)", "331 × 349 grid, 5 s < Δt < 60 s, sub-grid source widened"],
  ["Actual event, full run", "Green's-law η < 5 cm; first arrival 200–330 min"],
  ["2004 validation, full run", "Batticaloa arrival 80–160 min (observed ≈ 120 min)"],
];

export function MethodsView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const P = t.pages.methods;
  return (
    <>
      <JsonLd
        data={articleLd({
          type: "TechArticle",
          headline: "Methods and model card: a browser-based linear shallow-water tsunami model of the Indian Ocean",
          locale,
          description: t.meta.pages.methods.description,
          path: "/methods",
          og: "methods",
          about: ["Shallow water equations", "Finite difference method", "Tsunami modelling", "Model validation"],
        })}
      />
      <PageHeader
        locale={locale}
        crumbs={[{ name: t.nav.items.methods[0], path: "/methods" }]}
        icon={FlaskConical}
        eyebrow={P.eyebrow}
        title={P.title}
        lead={P.lead}
      >
        <nav className="mt-6 flex flex-wrap gap-1.5" aria-label="On this page">
          {TOC.map(([id, l]) => (
            <a key={id} href={`#${id}`} className="btn !min-h-0 !py-1 !text-xs">
              {l}
            </a>
          ))}
        </nav>
      </PageHeader>
      {locale !== "en" && (
        <Container className="pt-8">
          <EnglishOnlyNotice locale={locale} />
        </Container>
      )}
      <Container lang={locale === "en" ? undefined : "en"} className="py-10">
        <div className="prose-sci max-w-[860px]">
          <section id="card" className="scroll-mt-20">
            <h2>Model card</h2>
            <table className="tbl not-prose">
              <tbody className="[&_td]:!whitespace-normal [&_td]:!text-left [&_td:first-child]:w-48 [&_td:first-child]:font-semibold">
                <tr><td>Model type</td><td>Linear shallow-water (long-wave) equations on the sphere, plus empirical magnitude–distance relations</td></tr>
                <tr><td>Domain</td><td>{DOM.lon0}–{DOM.lon1}° E, {Math.abs(DOM.lat0)}° S – {DOM.lat1}° N (northern and central Indian Ocean, from the Makran coast to central Sumatra)</td></tr>
                <tr><td>Source catalogue</td><td>21 source zones (subduction, intraplate, mid-ocean ridge, transform) at representative points, each an idealised single-plane source; any custom epicentre inside the domain, at least 3° from its edges</td></tr>
                <tr><td>Land mask (offline fallback)</td><td>Natural Earth 1:10m land rasterised at 10′ (scripts/landmask.mjs)</td></tr>
                <tr><td>Resolution</td><td>10′ (≈ 18.5 km, 331 × 349) or 5′ (≈ 9.3 km, 661 × 697)</td></tr>
                <tr><td>Outputs</td><td>η(x, t), η<sub>max</sub>, first-arrival time, synthetic gauges at {TOWNS.length} Sri Lankan and {GAUGES.length - TOWNS.length} regional points, coastal estimates and threat levels</td></tr>
                <tr><td>Intended use</td><td>Teaching; research screening of far-field travel times and order-of-magnitude amplitudes; exploring sensitivity and uncertainty; reproducible demonstrations</td></tr>
                <tr><td>Out of scope</td><td>Operational warning; inundation or evacuation mapping; near-field sources; landslide or volcanic tsunamis; harbour currents</td></tr>
                <tr><td>Runtime</td><td>In the browser (Web Worker). Seconds at 10′, tens of seconds at 5′ on a laptop</td></tr>
                <tr><td>Licence</td><td>Open source; see the repository</td></tr>
              </tbody>
            </table>
          </section>

          <section id="equations" className="scroll-mt-20">
            <h2>Governing equations</h2>
            <Eq tex={TEX.lswe} cap="η: sea-surface elevation; M, N: depth-integrated volume fluxes in λ (longitude) and φ (latitude); h: still-water depth; R: Earth radius" />
            <p>
              Nonlinear advection, bottom friction, Coriolis force and frequency dispersion are neglected. These are standard assumptions for deep-ocean
              propagation of large tsunamis (Goto et al., 1997); their consequences are discussed under <a href="#limits">limitations</a>.
            </p>
          </section>

          <section id="numerics" className="scroll-mt-20">
            <h2>Numerical scheme</h2>
            <ul>
              <li>Arakawa C-grid staggering: η at cell centres, M on east faces, N on north faces.</li>
              <li>Explicit forward–backward integration (continuity, then momentum with the updated η), second-order in space, as in TUNAMI-N1.</li>
              <li>
                Time step from the CFL condition with safety factor {CFL}: <M t={String.raw`\Delta t = \lfloor ${CFL}\,\min_{i,j} [\sqrt{g h}\sqrt{\Delta x^{-2}+\Delta y^{-2}}]^{-1}\rfloor`} /> s.
              </li>
              <li>Coastlines: zero normal flux between wet and dry cells (full reflection).</li>
              <li>
                Open boundaries: {SPONGE_CELLS}-cell sponge with damping factor <M t={String.raw`1 - 0.12\,((n-e)/n)^2`} /> per step, e = distance to the edge.
              </li>
              <li>
                Bathymetry: Terrarium-encoded ETOPO1 tiles at zoom 5, 3 × 3 sub-sampled and averaged per cell; a cell is wet if most samples are below sea level
                and the mean depth exceeds 10 m (minimum depth 20 m). If tiles are unavailable, an idealised shelf (60 m + 4 m/km), slope and abyssal plain
                (≈ 4,100–4,500 m) is built from the real coastline by distance-to-coast.
              </li>
              <li>Checkpoints every 30 min (10′) or 60 min (5′) of simulated time allow exact replay for animation without storing every frame.</li>
            </ul>
            <Eq tex={TEX.cfl} />
          </section>

          <section id="source" className="scroll-mt-20">
            <h2>Source model</h2>
            <Eq tex={TEX.scaling} cap="Wells & Coppersmith (1994) all-slip-type regressions; Hanks & Kanamori (1979); μ = 3 × 10¹⁰ Pa; Kajiura (1963)" />
            <p>
              The initial sea surface is an instantaneous Gaussian deformation oriented along strike with half-widths σ = L/2.5 and W/2.5, shaped by
              mechanism: thrust = uplift with a trailing trough, normal = subsidence with flank uplift, strike-slip = quadrupole with near-zero net volume.
              Sources narrower than two grid cells are widened to the grid scale while conserving displaced volume. Mechanism factors:
            </p>
            <table className="tbl not-prose">
              <thead>
                <tr><th>Mechanism</th><th>κ = vertical/slip</th><th>Mₜ − Mw</th></tr>
              </thead>
              <tbody>
                {(Object.keys(MECH) as (keyof typeof MECH)[]).map((k) => (
                  <tr key={k}><td>{MECH[k].label}</td><td>{MECH[k].k}</td><td>{MECH[k].adj.toFixed(1)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="coast" className="scroll-mt-20">
            <h2>Coastal estimates and arrival times</h2>
            <ul>
              <li>Each station is snapped to the nearest wet cell deeper than 30 m (else 10 m) within about 1.2°.</li>
              <li>Offshore arrival: first time |η| ≥ 5 % of the gauge maximum. Shore arrival adds shelf transit at the mean of √(g h<sub>gauge</sub>) and √(g · 5 m).</li>
              <li>Coastal amplitude: Green&apos;s-law extrapolation of the gauge maximum to 1 m depth.</li>
              <li>Threat level (PTWC-style): {LEVELS.map((l) => l.label).join(", ")} with thresholds 0.3, 1 and 3 m, applied to the larger of the numerical and empirical estimates.</li>
              <li>Flooding overlay: a bathtub fill of land connected to the sea below the maximum coastal estimate, limited inland; for illustration only.</li>
            </ul>
            <Eq tex={TEX.green} />
          </section>

          <section id="empirical" className="scroll-mt-20">
            <h2>Empirical model</h2>
            <Eq tex={TEX.abe} cap="Abe (1981) tide-gauge amplitude H and Abe (1989) local-mean run-up Hₜ; Δ in km (≥ 100), C = 0" />
            <p>
              Analytic travel time uses a path-averaged depth of {H_PATH.toLocaleString()} m plus 15 min shelf transit. Coasts facing away from the source are
              reached by a path routed around the island through way-points off Dondra Head, with a ×0.5 shelter factor.
            </p>
          </section>

          <section id="uq" className="scroll-mt-20">
            <h2>Uncertainty quantification</h2>
            <p>
              The Monte Carlo propagates magnitude (normal), mechanism (categorical), empirical scatter (lognormal, σ<sub>log₁₀</sub>) and path-mean depth
              (normal, truncated at 2,500 m) through Abe (1981). A Mulberry32 generator with a user-set seed makes every result exactly reproducible. Numerical
              uncertainty (resolution, bathymetry) is explored with the run history and convergence comparison in the simulator.
            </p>
          </section>

          <section id="verification" className="scroll-mt-20">
            <h2>Verification</h2>
            <p>An automated test suite (<code>npm test</code>) checks the physics on every change. Current checks:</p>
            <table className="tbl not-prose">
              <thead><tr><th>Check</th><th>Expected</th></tr></thead>
              <tbody>{TESTS.map(([a, b]) => <tr key={a}><td>{a}</td><td className="!whitespace-normal">{b}</td></tr>)}</tbody>
            </table>
          </section>

          <section id="validation" className="scroll-mt-20">
            <h2>Validation</h2>
            <p>
              The 2004 Sumatra–Andaman scenario reproduces the observed ≈ 2 h first arrival on Sri Lanka&apos;s east coast (Goff et al., 2006). Amplitudes are
              not reproduced (observed run-up ≈ 5–12 m; Liu et al., 2005), as expected for a uniform-slip source, a regional grid and linear coastal
              extrapolation. Run it yourself: <Link href="/simulator?scen=v2004&tab=results">2004 validation in the simulator</Link>.
            </p>
          </section>

          <section id="limits" className="scroll-mt-20">
            <h2>Known limitations</h2>
            <ul>
              <li><b>Dispersion:</b> neglected. For small sources (λ/h &lt; 20) the model overestimates amplitude and arrives early.</li>
              <li><b>Source:</b> idealised, instantaneous, uniform; no Okada deformation, no rupture kinematics, no splay faults.</li>
              <li><b>Resolution:</b> sub-grid sources are not amplitude-converged; shelf and bay resonance are not resolved.</li>
              <li><b>Coast:</b> reflective walls at the grid coastline; no wetting–drying, friction or nonlinearity.</li>
              <li><b>Bathymetry:</b> ETOPO1 at ≈ 1 arc-minute, block-averaged; live tiles depend on network access.</li>
              <li><b>Empirical relations:</b> derived largely from Pacific data; scatter is a factor of 2–3.</li>
            </ul>
          </section>

          <section id="repro" className="scroll-mt-20">
            <h2>Reproducibility</h2>
            <ul>
              <li>Every simulator scenario has a permalink (Share) encoding scenario, source, resolution and layer.</li>
              <li>Each run exports metadata (JSON) with parameters, grid, time step, bathymetry source and initial condition, plus gauge series (CSV) and η<sub>max</sub> grids (ESRI ASCII).</li>
              <li>Figures export as SVG, PNG and the underlying CSV.</li>
              <li>The physics lives in plain TypeScript modules with no browser dependencies, so it can be run headless (the test suite does exactly that).</li>
            </ul>
          </section>
        </div>
      </Container>
    </>
  );
}
