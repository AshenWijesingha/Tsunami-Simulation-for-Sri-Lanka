import { C_PATH, g, H_PATH, MU } from "./constants";

export type Mechanism = "normal" | "strike" | "thrust";
export type ScenarioId = "actual" | "whatif" | "v2004";

/**
 * Mechanism factors.
 *  k   — fraction of mean slip that becomes net vertical seafloor displacement (κ).
 *  adj — offset from Mw to tsunami magnitude Mt, used in the Abe relations.
 * Both are teaching-level assumptions; see /methods for the rationale and caveats.
 */
export const MECH: Record<Mechanism, { k: number; adj: number; label: string }> = {
  thrust: { k: 0.5, adj: 0, label: "thrust" },
  normal: { k: 0.3, adj: -0.3, label: "normal" },
  strike: { k: 0.06, adj: -0.8, label: "strike-slip" },
};

export interface Scenario {
  id: ScenarioId;
  short: string;
  label: string;
  lat: number;
  lon: number;
  M: number;
  mech: Mechanism;
  strike: number;
  locked: boolean;
  L?: number;
  W?: number;
  clock: { base: number; tz: string };
  badge: "safe" | "hypo" | "val";
  status: string;
  note: string;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  actual: {
    id: "actual",
    short: "A · Actual M6.5",
    label: "A · Actual M6.5 (24 Nov 2026)",
    lat: -17.78,
    lon: 65.82,
    M: 6.5,
    mech: "normal",
    strike: 160,
    locked: true,
    clock: { base: 16 * 60 + 36, tz: "SLT" },
    badge: "safe",
    status: "Official: no tsunami threat",
    note: "Parameters from Bulletin No. 02. Mechanism and strike are assumptions; change them to explore sensitivity.",
  },
  whatif: {
    id: "whatif",
    short: "B · What-if",
    label: "B · Hypothetical source",
    lat: -17.78,
    lon: 65.82,
    M: 8.5,
    mech: "thrust",
    strike: 160,
    locked: false,
    clock: { base: 16 * 60 + 36, tz: "SLT" },
    badge: "hypo",
    status: "Hypothetical scenario",
    note: "Hypothetical: this did not happen. Choose a source zone from the catalogue, or set your own epicentre, magnitude, mechanism and strike.",
  },
  v2004: {
    id: "v2004",
    short: "C · 2004 validation",
    label: "C · 2004 Sumatra–Andaman (validation)",
    lat: 8.0,
    lon: 93.0,
    M: 9.1,
    mech: "thrust",
    strike: 340,
    locked: true,
    L: 1300,
    W: 150,
    clock: { base: 58 + 53 / 60, tz: "UTC" },
    badge: "val",
    status: "Validation case (2004)",
    note: "Validation case: an idealised single-segment source (L = 1,300 km, W = 150 km, strike 340°) centred near 8° N, 93° E with instantaneous rupture. The real rupture lasted about 8–10 min and was strongly heterogeneous. Observed first arrival in Sri Lanka: about 2 h after the earthquake (Goff et al., 2006).",
  },
};

export interface Params {
  scen: ScenarioId;
  lat: number;
  lon: number;
  M: number;
  mech: Mechanism;
  strike: number;
  /** Grid resolution in arc-minutes (10 or 5). */
  res: 10 | 5;
  bathy: "auto" | "fallback";
  /** Simulated duration (min). */
  dur: number;
}

export const DEFAULT_PARAMS: Params = {
  scen: "actual",
  lat: SCENARIOS.actual.lat,
  lon: SCENARIOS.actual.lon,
  M: 6.5,
  mech: "normal",
  strike: 160,
  res: 10,
  bathy: "auto",
  dur: 420,
};

export interface Source {
  lat: number;
  lon: number;
  M: number;
  mech: Mechanism;
  strike: number;
  /** Rupture length and width (km). */
  L: number;
  W: number;
  /** Seismic moment (N m). */
  Mo: number;
  /** Mean slip (m). */
  D: number;
  /** Net vertical seafloor displacement (m). */
  uplift: number;
  /** √(LW) (km). */
  dim: number;
  /** Characteristic wavelength 2√(LW) (km). */
  lam0: number;
  kh: number;
  /** Kajiura factor 1/cosh(kh). */
  kaj: number;
  /** Initial sea-surface amplitude (m). */
  A0: number;
  /** Characteristic period (s). */
  T: number;
  /** Tsunami magnitude estimate. */
  Mt: number;
  /** Wavelength at 10 m depth (km). */
  lamCoast: number;
  prescribedLW: boolean;
}

/**
 * Derive source parameters from magnitude using Wells & Coppersmith (1994) "all-slip-type"
 * regressions, Hanks & Kanamori (1979) moment, and Kajiura (1963) water-column filtering.
 */
export function buildSource(p: Pick<Params, "scen" | "lat" | "lon" | "M" | "mech" | "strike">): Source {
  const sc = SCENARIOS[p.scen];
  const mc = MECH[p.mech];
  const M = p.M;
  let L = Math.pow(10, -2.44 + 0.59 * M),
    W = Math.pow(10, -1.01 + 0.32 * M);
  const prescribed = !!(sc.L && sc.W);
  if (prescribed) {
    L = sc.L!;
    W = sc.W!;
  }
  const Mo = Math.pow(10, 1.5 * M + 9.1);
  const D = Mo / (MU * L * 1e3 * W * 1e3);
  const uplift = D * mc.k;
  const dim = Math.sqrt(L * W);
  const lam0 = 2 * dim;
  const kh = (2 * Math.PI * H_PATH) / (lam0 * 1e3);
  const kaj = 1 / Math.cosh(kh);
  const A0 = uplift * kaj;
  const T = (lam0 * 1e3) / C_PATH;
  return {
    lat: p.lat,
    lon: p.lon,
    M,
    mech: p.mech,
    strike: p.strike,
    L,
    W,
    Mo,
    D,
    uplift,
    dim,
    lam0,
    kh,
    kaj,
    A0,
    T,
    Mt: M + mc.adj,
    lamCoast: (T * Math.sqrt(g * 10)) / 1e3,
    prescribedLW: prescribed,
  };
}

/** Abe (1981): maximum tide-gauge amplitude (m) at distance Δ km. */
export const abe81 = (dkm: number, Mt: number) => Math.pow(10, Mt - 5.8 - Math.log10(Math.max(dkm, 100)));
/** Abe (1989): local-mean run-up height (m) at distance Δ km (C = 0). */
export const abe89 = (dkm: number, Mt: number) => Math.pow(10, Mt - 5.55 - Math.log10(Math.max(dkm, 100)));

/** Magnitude needed for Abe (1989) Ht to reach `h` metres at distance Δ for a mechanism. */
export const mwForHeight = (h: number, dkm: number, mech: Mechanism) =>
  Math.log10(h) + 5.55 + Math.log10(dkm) - MECH[mech].adj;
