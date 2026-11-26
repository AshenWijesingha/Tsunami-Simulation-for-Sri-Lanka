import Link from "next/link";
import type { ReactNode } from "react";
import { Chart } from "@/components/charts/Chart";
import { decaySpec, dispersionNumbers, dispersionSpec, sensitivitySpec, travelSpec } from "@/components/analysis/specs";
import { LiveRun } from "@/components/learn/LiveRun";
import { Eq, M } from "@/components/ui/Tex";
import { KV } from "@/components/ui/KV";
import { TEX } from "./equations";
import { C_KMMIN, DONDRA, EPI, H_PATH } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { analyticTown, TOWNS } from "@/lib/physics/stations";
import { buildSource, DEFAULT_PARAMS, MECH, mwForHeight } from "@/lib/physics/source";
import { cgNorm } from "@/lib/physics/waves";
import { fmtDur, fmtLen, fmtSci } from "@/lib/format";

const SRC = buildSource(DEFAULT_PARAMS);
const D_SL = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);

function Fig({ children, cap }: { children: ReactNode; cap: ReactNode }) {
  return (
    <figure className="card my-6 p-3 not-prose">
      {children}
      <figcaption className="note mt-2 px-1">{cap}</figcaption>
    </figure>
  );
}

function Box({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div className={`callout callout-${tone} my-5`}>
      <b>{title}.</b> {children}
    </div>
  );
}

export const CHAPTER_BODY: Record<string, () => ReactNode> = {
  overview: () => (
    <>
      <p>
        This course works through the hazard assessment behind an operational <i>No Tsunami Threat</i> decision, using the M6.5 earthquake of 24
        November 2026 in the Mauritius–Réunion region, about {Math.round(D_SL).toLocaleString()} km from Sri Lanka. It is written for graduate students,
        researchers and practitioners in coastal engineering, geophysics, oceanography and disaster risk reduction.
      </p>
      <h2>Learning outcomes</h2>
      <ol>
        <li>Derive tsunami source parameters from earthquake magnitude with empirical scaling relations.</li>
        <li>Formulate and solve the linear shallow-water equations on a sphere with finite differences, and explain the CFL condition.</li>
        <li>Explain amplitude decay, refraction, frequency dispersion and coastal shoaling.</li>
        <li>Compare numerical and empirical forecasts and quantify their uncertainty.</li>
        <li>Validate a model against an observed event (2004) and state its limitations honestly.</li>
        <li>Connect hazard estimates to exposure, vulnerability and warning decisions.</li>
      </ol>
      <h2>How to use this course</h2>
      <p>
        Every chapter has a <b>Show in simulator</b> button that loads the matching scenario, map layer and view. Numbers in the text that depend on the
        numerical model are computed live in your browser; everything else is computed from the same source code that drives the model, so text and model
        cannot drift apart.
      </p>
      <Box title="Research question">
        What coastal amplitude can a shallow M6.5 event at Δ ≈ 3,100 km generate in Sri Lanka, and how confident can we be in that answer, given
        what forecasters knew one hour after the earthquake?
      </Box>
    </>
  ),

  bulletin: () => (
    <>
      <KV
        className="my-5 card p-4 not-prose"
        rows={[
          ["Magnitude", "6.5"],
          ["Depth", "10 km"],
          ["Origin time", "24/11/2026 16:36 SLT (11:06 UTC)"],
          ["Epicentre", "17.78° S, 65.82° E"],
          ["Region", "Mauritius–Réunion region (Central Indian Ridge)"],
          ["Bulletin", "No. 02 (White), 17:41 SLT, t + 65 min"],
          ["Decision", "No tsunami threat; coasts declared safe"],
        ]}
      />
      <p>
        Forecasters had roughly an hour to decide, using only the hypocentre and magnitude. No focal mechanism was available, and sea-level confirmation
        was impossible, because any waves would not reach Sri Lanka for more than four hours.
      </p>
      <h2>Decision under uncertainty</h2>
      <p>
        Far-field tsunami warning is a classification problem with asymmetric costs. A missed event can cost lives; a false alarm evacuates coasts, halts
        fishing and tourism, and erodes the public trust that the next warning depends on. Operational centres therefore use <b>decision matrices</b>{" "}
        based on magnitude, depth and location, refined by forecast models and confirmed by sea-level observations (deep-ocean pressure sensors and tide
        gauges).
      </p>
      <p>
        For this event the decision rests on three facts: the magnitude is small for a tsunami source, the location is a mid-ocean ridge rather than a
        subduction zone, and the distance is large. The rest of the course tests how robust that reasoning is.
      </p>
    </>
  ),

  tectonics: () => (
    <>
      <p>
        The epicentre lies on the <b>Central Indian Ridge</b>, a slow-to-intermediate spreading boundary between the African (Somalian) and
        Indo-Australian plates, segmented by transform faults.
      </p>
      <ul>
        <li>
          <b>Spreading segments</b> host normal faulting, with modest vertical deformation dominated by subsidence.
        </li>
        <li>
          <b>Transform faults</b> host strike-slip faulting, with near-zero net vertical seafloor displacement.
        </li>
        <li>
          <b>Thrust</b> faulting, the most efficient tsunami generator, is not expected here. We use it only as an upper bound.
        </li>
      </ul>
      <p>
        Analogue: the 11 April 2012 Mw 8.6 earthquake in the Wharton Basin off Sumatra, the largest strike-slip event ever recorded, produced only small
        tsunami waves around the Indian Ocean (USGS). <b>Mechanism matters as much as magnitude.</b>
      </p>
      <h2>Mechanism factors used in this tool</h2>
      <table className="tbl not-prose">
        <thead>
          <tr>
            <th>Mechanism</th>
            <th>κ (vertical / slip)</th>
            <th>Mₜ − Mw</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(MECH) as (keyof typeof MECH)[]).map((k) => (
            <tr key={k}>
              <td>{MECH[k].label}</td>
              <td>{MECH[k].k}</td>
              <td>{MECH[k].adj.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        These are teaching-level assumptions that capture the ordering thrust &gt; normal ≫ strike-slip. A research study would compute deformation with
        Okada (1985) from a moment-tensor solution.
      </p>
    </>
  ),

  generation: () => (
    <>
      <Eq tex={TEX.scaling} cap="Wells & Coppersmith (1994); Hanks & Kanamori (1979); Kajiura (1963) water-column filter" />
      <KV
        className="my-5 card p-4 not-prose"
        rows={[
          ["L × W", `${SRC.L.toFixed(1)} × ${SRC.W.toFixed(1)} km`],
          ["M₀", `${fmtSci(SRC.Mo)} N·m`],
          ["Mean slip D", `${SRC.D.toFixed(2)} m`],
          ["κ (mechanism)", `${MECH[SRC.mech].k} (${MECH[SRC.mech].label})`],
          ["1/cosh(kh)", SRC.kaj.toFixed(3)],
          ["A₀", fmtLen(SRC.A0)],
        ]}
      />
      <p>
        The water column acts as a low-pass filter: seafloor deformation at horizontal scales comparable to the depth is smoothed at the surface. Kajiura
        (1963) showed the transfer function is approximately <M t={String.raw`1/\cosh(kh)`} />.
      </p>
      <p>
        At 10′ resolution the source is <b>smaller than about two grid cells</b>. The model widens it to the grid scale while <b>conserving displaced
        volume</b>, the quantity that controls far-field long-wave energy. A full treatment would use the Okada (1985) elastic dislocation solution on a
        finer, nested grid.
      </p>
      <Box title="Try it" tone="info">
        In the simulator, switch to scenario B and drag the magnitude from 6.5 to 9.0. Watch L, W, D and A₀ in the Model tab: amplitude grows roughly as
        10<sup>0.5 Mw</sup> through slip, while the source footprint grows too.
      </Box>
    </>
  ),

  method: () => (
    <>
      <Eq tex={TEX.lswe} cap="Linear shallow-water equations in spherical coordinates; M, N = depth-integrated volume fluxes" />
      <Eq tex={TEX.cfl} cap="Courant–Friedrichs–Lewy stability condition (the model uses 0.85 of the limit)" />
      <ul>
        <li>Arakawa C-grid: η at cell centres, M and N on cell faces.</li>
        <li>Explicit forward–backward time stepping: continuity first, then momentum with the updated η (TUNAMI-N1 type; Goto et al., 1997).</li>
        <li>Fully reflective coastlines (zero normal flux into dry cells); a 14-cell quadratic sponge damps waves at the open boundaries.</li>
        <li>Bathymetry: ETOPO1 (Terrarium tiles) block-averaged with 3 × 3 sub-sampling to the model grid.</li>
        <li>Domain 50–100° E, 30° S – 25° N; 10′ (≈ 18.5 km) or 5′ (≈ 9.3 km).</li>
      </ul>
      <p>
        The model runs in a Web Worker in your browser. On a 10′ grid there are about 10⁵ cells and a few hundred time steps; the 5′ grid needs four times
        the cells and twice the steps (CFL), so about eight times the work.
      </p>
      <p>
        Full documentation, verification tests and the model card are on the <Link href="/methods">Methods</Link> page.
      </p>
    </>
  ),

  propagation: () => (
    <>
      <Eq tex={TEX.speed} />
      <p>
        Press <b>Play</b> in the simulator. The leading wave crosses the basin at about 713 km/h in 4 km of water, refracting over ridges and plateaus
        (the Mascarene Plateau, the Chagos–Laccadive Ridge), which act as wave-guides or barriers.
      </p>
      <p>
        Amplitude falls through geometric spreading (≈ Δ<sup>−1/2</sup> for a point source, faster near a finite source) and directivity. Short ripples
        trailing the front are partly <i>numerical</i> dispersion of a near-grid-scale source, not physics; point them out when discussing resolution.
        Switch to <b>η<sub>max</sub></b> (key <span className="kbd">2</span>) for the energy pattern and to <b>Travel time</b> (<span className="kbd">3</span>
        ) for hourly isochrones.
      </p>
      <Fig cap="Long-wave travel time for uniform depths. Numerical arrivals (from your latest run, if any) scatter around these lines because of refraction over real bathymetry.">
        <Chart {...travelSpec(null)} height={360} />
      </Fig>
      <p>
        Analytic arrival at Colombo: {fmtDur(analyticTown(TOWNS.find((t) => t.name === "Colombo")!, SRC).eta)} (great-circle distance at √(gh) plus 15 min
        of shelf transit).
      </p>
      <LiveRun scen="actual" show="arrivals" />
    </>
  ),

  dispersion: () => {
    const dn = dispersionNumbers(SRC);
    return (
      <>
        <Eq tex={TEX.disp} cap="Airy linear dispersion relation" />
        <p>
          The shallow-water equations assume λ ≫ h (kh → 0). For this source λ ≈ {SRC.lam0.toFixed(0)} km, so <b>kh ≈ {SRC.kh.toFixed(2)}</b> and λ/h ≈{" "}
          {dn.lamOverH.toFixed(0)}. That is below the λ/h ≈ 20 long-wave limit, so the wave is <b>dispersive</b>.
        </p>
        <Fig cap={<>Phase (c) and group (c<sub>g</sub>) speed normalised by √(gh). Markers: the current source.</>}>
          <Chart {...dispersionSpec(SRC.kh)} height={360} />
        </Fig>
        <ul>
          <li>
            Energy travels at c<sub>g</sub> = {cgNorm(SRC.kh).toFixed(2)} c₀, so the main wave train arrives about {fmtDur(dn.tG - dn.tL)} later than the
            long-wave prediction ({fmtDur(dn.tL)} vs {fmtDur(dn.tG)}).
          </li>
          <li>
            Dispersion spreads the wave train and lowers peak amplitude, so the long-wave model <b>overestimates</b> far-field amplitude for small events.
            Comer (1980) shows the empirical magnitude–height slope changes from 4/3 (non-dispersive) to 2/3 (strongly dispersive).
          </li>
          <li>Large megathrust events (λ ≈ 200–500 km) are effectively non-dispersive across ocean basins.</li>
        </ul>
        <Box title="Implication" tone="warn">
          For the actual event our numerical amplitudes are an upper bound, which only strengthens the no-threat conclusion.
        </Box>
      </>
    );
  },

  coast: () => (
    <>
      <Eq tex={TEX.green} cap="Green's law (1838): energy-flux conservation for slowly varying depth, no reflection" />
      <p>
        Offshore model values are extrapolated to the coast with Green&apos;s law (here to 1 m depth). The empirical Abe relations go straight from
        magnitude and distance to tide-gauge amplitude and local-mean run-up height:
      </p>
      <Eq tex={TEX.abe} cap="Abe (1981) tide-gauge amplitude; Abe (1989) run-up height (C = 0)" />
      <Fig cap="Empirical decay with distance for the actual event. Dashed lines: threat thresholds. Sri Lanka is marked.">
        <Chart {...decaySpec(SRC, null)} height={380} />
      </Fig>
      <p>
        Sri Lanka&apos;s south and west coasts face this source. The east coast sits in the island&apos;s shadow and is reached only by diffraction and
        refraction around Dondra Head; the analytic model routes the path around the island and applies a ×0.5 shelter factor. For a source east of the
        island (2004) the situation reverses: the east coast is directly exposed, and the south and west coasts are reached by waves that wrap around the
        island, which is why the south-west was still severely hit in 2004.
      </p>
      <p>
        Toggle <b>Low-lying land</b> in the simulator&apos;s Results tab to see coastal exposure: land 0–2, 2–5 and 5–10 m above sea level.
      </p>
    </>
  ),

  results: () => (
    <>
      <p>
        Two independent approaches, a numerical shallow-water model and empirical magnitude–distance relations, are compared for 21 coastal stations. The
        governing estimate at each station is the larger of the two.
      </p>
      <LiveRun scen="actual" show="summary" />
      <p>
        Both approaches give amplitudes of order millimetres: below the 0.3 m information threshold by more than two orders of magnitude, and far below the
        normal tidal range around Sri Lanka. The bulletin&apos;s <b>No Tsunami Threat</b> decision is strongly supported.
      </p>
      <p className="note">The full comparison table, synthetic tide-gauge records and data exports are in the simulator&apos;s Results and Tide gauges tabs.</p>
    </>
  ),

  uncertainty: () => (
    <>
      <p>
        Main sources of epistemic uncertainty: the focal mechanism (unknown at decision time), magnitude (± 0.1–0.2), the empirical scatter of Abe-type
        relations (a factor of 2–3), source geometry, and coastal amplification.
      </p>
      <Fig cap="Abe (1989) run-up height at Sri Lanka versus magnitude, for each mechanism, from the bulletin epicentre.">
        <Chart {...sensitivitySpec(D_SL, 6.5)} height={380} />
      </Fig>
      <ul>
        <li>
          The magnitude needed to reach 0.3 m in Sri Lanka from this location is about <b>M{mwForHeight(0.3, D_SL, "thrust").toFixed(1)}</b> even for
          thrust faulting; for normal and strike-slip faulting it is M{mwForHeight(0.3, D_SL, "normal").toFixed(1)} and M
          {mwForHeight(0.3, D_SL, "strike").toFixed(1)}.
        </li>
        <li>
          A Monte Carlo over magnitude, mechanism, empirical scatter and path depth (<Link href="/analysis">Analysis, chart 5</Link>) gives a probability of
          exceeding 0.3 m that is effectively zero.
        </li>
      </ul>
      <p>Try scenario B in the simulator with M8.5–9.0 thrust to see when the threat level changes.</p>
    </>
  ),

  validation: () => (
    <>
      <p>
        Scenario C runs the same code with an idealised Mw 9.1 megathrust source (L = 1,300 km, W = 150 km, strike 340°, centred near 8° N, 93° E) and
        instantaneous rupture.
      </p>
      <LiveRun scen="v2004" show="validation" />
      <p>
        <b>Travel times</b> are controlled by bathymetry and are reproduced well. <b>Amplitudes</b> are not: observed run-up in Sri Lanka reached several
        metres to over 10 m (Liu et al., 2005; Wijetunge, 2005; Goff et al., 2006). Reproducing that needs a heterogeneous slip model, rupture kinematics,
        nonlinear nearshore physics and high-resolution nested grids.
      </p>
      <Box title="What validation means here">
        A model is valid for a purpose. This one is fit for travel times and for order-of-magnitude far-field amplitude screening; it is not fit for
        inundation mapping.
      </Box>
    </>
  ),

  discussion: () => (
    <>
      <ul>
        <li>
          <b>Source:</b> Gaussian deformation with scaling-law dimensions. Better: Okada (1985), finite-fault slip inversions, kinematic rupture.
        </li>
        <li>
          <b>Physics:</b> linear, non-dispersive, no Coriolis or bottom friction. Better: Boussinesq or non-hydrostatic solvers for small sources, and
          nonlinear SWE with friction near shore.
        </li>
        <li>
          <b>Resolution:</b> 10′/5′ grid. Re-run at 5′ and compare in the Runs tab: for the sub-grid M6.5 source the far-field amplitude is <i>not</i>{" "}
          grid-converged, which is why a convergence study belongs in any credible result. Better: nested grids down to tens of metres and high-resolution
          bathymetry (GEBCO plus local surveys).
        </li>
        <li>
          <b>Coast:</b> Green&apos;s law and bathtub flooding. Better: wetting–drying inundation models on high-resolution topography.
        </li>
        <li>
          <b>Operations:</b> pre-computed scenario databases, data assimilation of deep-ocean pressure sensors, and probabilistic tsunami hazard analysis
          (PTHA).
        </li>
      </ul>
      <h2>Suggested research projects</h2>
      <ol>
        <li>Quantify dispersion error for ridge and transform events with a Boussinesq model.</li>
        <li>Build a PTHA for Sri Lanka from Sunda, Makran and intraplate sources, with logic-tree uncertainty.</li>
        <li>Sensitivity of east-coast arrivals and amplitudes to bathymetric resolution and the Sri Lankan shelf.</li>
        <li>Couple hazard to exposure and fragility for an impact-based warning prototype (see <Link href="/impact">Impact</Link>).</li>
        <li>Evaluate decision thresholds with a cost–loss framework using historical Indian Ocean events.</li>
      </ol>
      <p>
        Practice with the <Link href="/exercises">exercises</Link>: predict and verify, the operational decision at t + 65 min, the forecaster challenge and
        a concept quiz.
      </p>
    </>
  ),
};

export const H_PATH_KM = H_PATH / 1000;
export const C_KMH = C_KMMIN * 60;
