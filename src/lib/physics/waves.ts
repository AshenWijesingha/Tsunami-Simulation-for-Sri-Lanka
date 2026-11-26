import { C_PATH, EPI, g, H_PATH } from "./constants";
import { hav } from "./geo";
import { MECH, type Mechanism } from "./source";

/** Phase speed normalised by √(gh) for linear Airy waves. */
export const cpNorm = (kh: number) => Math.sqrt(Math.tanh(kh) / kh);
/** Group speed normalised by √(gh). */
export const cgNorm = (kh: number) => cpNorm(kh) * 0.5 * (1 + (2 * kh) / Math.sinh(2 * kh));

/** Long-wave travel time (h) over distance (km) at uniform depth h (m). */
export const travelHours = (dkm: number, h: number) => (dkm * 1e3) / Math.sqrt(g * h) / 3600;

export const greenGain = (h1: number, h2: number) => Math.pow(h1 / h2, 0.25);

/** Standard normal deviate (Box–Muller). Accepts an optional RNG for reproducibility. */
export function randn(rng: () => number = Math.random) {
  let u = 0,
    v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Mulberry32 seeded PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MCConfig {
  n: number;
  seed: number;
  Mmean: number;
  Msd: number;
  pNormal: number;
  pStrike: number;
  pThrust: number;
  /** σ of log10 empirical scatter. */
  sigmaLog: number;
  hMean: number;
  hSd: number;
  /** Distance to target (km). */
  dkm: number;
}

export const DEFAULT_MC: MCConfig = {
  n: 5000,
  seed: 20261124,
  Mmean: 6.5,
  Msd: 0.1,
  pNormal: 0.5,
  pStrike: 0.4,
  pThrust: 0.1,
  sigmaLog: 0.25,
  hMean: H_PATH,
  hSd: 400,
  /** Weligama, the nearest south-coast station along the great circle. */
  dkm: hav(EPI.lat, EPI.lon, 5.974, 80.43),
};

export interface MCResult {
  cfg: MCConfig;
  amps: Float64Array;
  etas: Float64Array;
  p: { a5: number; a50: number; a95: number; a999: number; e5: number; e50: number; e95: number; pExceed: number; pExceed1: number };
}

/** Monte Carlo propagation of source and model uncertainty through Abe (1981). */
export function runMonteCarlo(cfg: MCConfig): MCResult {
  const rng = mulberry32(cfg.seed);
  const n = cfg.n,
    amps = new Float64Array(n),
    etas = new Float64Array(n);
  const tot = cfg.pNormal + cfg.pStrike + cfg.pThrust || 1;
  for (let i = 0; i < n; i++) {
    const M = cfg.Mmean + cfg.Msd * randn(rng),
      r = rng() * tot;
    const mech: Mechanism = r < cfg.pNormal ? "normal" : r < cfg.pNormal + cfg.pStrike ? "strike" : "thrust";
    const lh = M + MECH[mech].adj - 5.8 - Math.log10(cfg.dkm) + cfg.sigmaLog * randn(rng);
    amps[i] = Math.pow(10, lh);
    const h = Math.max(2500, cfg.hMean + cfg.hSd * randn(rng));
    etas[i] = (cfg.dkm * 1e3) / Math.sqrt(g * h) / 60 + 15;
  }
  amps.sort();
  etas.sort();
  const pc = (a: Float64Array, p: number) => a[Math.floor(p * (a.length - 1))];
  let ex = 0,
    ex1 = 0;
  for (const a of amps) {
    if (a >= 0.3) ex++;
    if (a >= 1) ex1++;
  }
  return {
    cfg,
    amps,
    etas,
    p: {
      a5: pc(amps, 0.05),
      a50: pc(amps, 0.5),
      a95: pc(amps, 0.95),
      a999: pc(amps, 0.999),
      e5: pc(etas, 0.05),
      e50: pc(etas, 0.5),
      e95: pc(etas, 0.95),
      pExceed: ex / n,
      pExceed1: ex1 / n,
    },
  };
}

export { C_PATH };
