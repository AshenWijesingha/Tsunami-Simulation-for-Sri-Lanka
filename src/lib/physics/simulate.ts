import { DOM, g } from "./constants";
import { hav } from "./geo";
import { buildBathymetry, type Bathymetry } from "./bathymetry";
import { initialCondition, makeSolver, snapGauge, type GaugeSnap, type InitialCondition } from "./solver";
import { buildSource, type Params, type Source } from "./source";
import { GAUGES } from "./stations";

export interface Checkpoint {
  n: number;
  eta: Float32Array;
  M: Float32Array;
  Nf: Float32Array;
  /** Running maximum of η up to and including step n (lets playback show "maximum so far"). */
  mx: Float32Array;
}

export interface GaugeResult {
  name: string;
  snap: GaugeSnap | null;
  t: Float32Array;
  v: Float32Array;
  /** Max positive η at the gauge (m). */
  max: number;
  maxAbs: number;
  /** First arrival at the offshore gauge (min): |η| ≥ 5 % of the gauge maximum. */
  arr: number;
  /** Shelf transit from gauge to shore (min). */
  shelf: number;
  /** Arrival at the shore (min). */
  etaShore: number;
  /** Green's-law extrapolation of `max` to 1 m depth (m). */
  green1: number;
  /** Great-circle distance from the source (km). */
  dist: number;
}

export interface RunData {
  id: string;
  createdAt: string;
  params: Params;
  src: Source;
  bathy: Bathymetry;
  dt: number;
  nSteps: number;
  ic: InitialCondition;
  gauges: GaugeResult[];
  etaMax: Float32Array;
  /** First-arrival time per cell (min), NaN where never exceeded. */
  arr: Float32Array;
  ck: Checkpoint[];
  /** Colour scale: P99 of ηmax beyond 500 km of the source. */
  scale: number;
  wall: number;
  thr: number;
  hmax: number;
  wetCount: number;
  /** Diagnostics: relative change of domain volume over the run. */
  massDrift: number;
}

export type Progress = { phase: "bathy" | "solve"; f: number; text: string };

const bathyCache = new Map<string, Bathymetry>();

export async function simulate(P: Params, onProgress: (p: Progress) => void, isCancelled: () => boolean = () => false): Promise<RunData | null> {
  const src = buildSource(P);
  const key = P.res + "_" + P.bathy;
  let B = bathyCache.get(key);
  if (!B) {
    onProgress({ phase: "bathy", f: 0, text: "Loading bathymetry…" });
    B = await buildBathymetry(P.res, P.bathy, (f) =>
      onProgress({ phase: "bathy", f, text: `Loading ETOPO1 bathymetry tiles… ${Math.round(f * 100)}%` }),
    );
    bathyCache.set(key, B);
  }
  if (isCancelled()) return null;
  const G = makeSolver(B),
    S = G.state(),
    ic = initialCondition(G, S, src);
  const nSteps = Math.ceil((P.dur * 60) / G.dt);
  const gs = GAUGES.map((st) => ({ st, snap: snapGauge(G, st.lat, st.lon), t: [] as number[], v: [] as number[] }));
  const etaMax = new Float32Array(G.N),
    arr = new Float32Array(G.N).fill(NaN);
  const thr = Math.max(ic.peak * 2e-4, 1e-9);
  const ckEvery = Math.max(1, Math.round(((P.res === 5 ? 60 : 30) * 60) / G.dt));
  const ck: Checkpoint[] = [];
  const t0 = performance.now();
  const vol0 = volume(S.eta, G.wet);

  const rec = () => {
    const tm = (S.n * G.dt) / 60;
    for (const q of gs)
      if (q.snap) {
        q.t.push(tm);
        q.v.push(S.eta[q.snap.k]);
      }
  };
  const track = () => {
    const e = S.eta,
      tm = (S.n * G.dt) / 60;
    for (let k = 0; k < G.N; k++) {
      const v = e[k];
      if (v > etaMax[k]) etaMax[k] = v;
      if ((v > thr || v < -thr) && arr[k] !== arr[k]) arr[k] = tm;
    }
  };
  rec();
  track();
  ck.push({ n: 0, eta: S.eta.slice(), M: S.M.slice(), Nf: S.Nf.slice(), mx: etaMax.slice() });
  let lastReport = 0;
  while (S.n < nSteps) {
    G.step(S);
    rec();
    track();
    if (S.n % ckEvery === 0) ck.push({ n: S.n, eta: S.eta.slice(), M: S.M.slice(), Nf: S.Nf.slice(), mx: etaMax.slice() });
    const now = performance.now();
    if (now - lastReport > 60) {
      lastReport = now;
      if (isCancelled()) return null;
      onProgress({
        phase: "solve",
        f: S.n / nSteps,
        text: `Time step ${S.n.toLocaleString()} / ${nSteps.toLocaleString()} (Δt = ${G.dt} s, ${G.nx}×${G.ny} cells)`,
      });
      // yield to the event loop so cancellation messages can arrive
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const wall = (performance.now() - t0) / 1000;
  const vol1 = volume(S.eta, G.wet);

  const gauges: GaugeResult[] = gs.map((q) => {
    const t = Float32Array.from(q.t),
      v = Float32Array.from(q.v);
    const dist = hav(src.lat, src.lon, q.st.lat, q.st.lon);
    if (!q.snap) return { name: q.st.name, snap: null, t, v, max: NaN, maxAbs: NaN, arr: NaN, shelf: NaN, etaShore: NaN, green1: NaN, dist };
    let mx = 0,
      ma = 0;
    for (const x of v) {
      if (x > mx) mx = x;
      if (Math.abs(x) > ma) ma = Math.abs(x);
    }
    let a = NaN;
    if (ma > 0)
      for (let i = 0; i < v.length; i++)
        if (Math.abs(v[i]) >= 0.05 * ma) {
          a = t[i];
          break;
        }
    const cG = Math.sqrt(g * q.snap.h),
      cS = Math.sqrt(g * 5);
    const shelf = (q.snap.dkm * 1e3) / (0.5 * (cG + cS)) / 60;
    return {
      name: q.st.name,
      snap: q.snap,
      t,
      v,
      max: mx,
      maxAbs: ma,
      arr: a,
      shelf,
      etaShore: Number.isFinite(a) ? a + shelf : NaN,
      green1: mx * Math.pow(q.snap.h / 1, 0.25),
      dist,
    };
  });

  const vals: number[] = [];
  for (let j = 0; j < G.ny; j += 2)
    for (let i = 0; i < G.nx; i += 2) {
      const k = j * G.nx + i;
      if (!G.wet[k]) continue;
      if (hav(DOM.lat0 + j * G.d, DOM.lon0 + i * G.d, src.lat, src.lon) > 500) vals.push(etaMax[k]);
    }
  vals.sort((a, b) => a - b);
  const scale = Math.max(vals[Math.floor(vals.length * 0.99)] || ic.peak, 1e-9);

  return {
    id: `${P.scen}-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    params: { ...P },
    src,
    bathy: B,
    dt: G.dt,
    nSteps,
    ic,
    gauges,
    etaMax,
    arr,
    ck,
    scale,
    wall,
    thr,
    hmax: G.hmax,
    wetCount: G.wetCount,
    massDrift: Math.abs(ic.vol) > 0 ? (vol1 - vol0) / Math.max(1e-30, Math.abs(vol0)) : 0,
  };
}

function volume(eta: Float32Array, wet: Uint8Array) {
  let s = 0;
  for (let k = 0; k < eta.length; k++) if (wet[k]) s += eta[k];
  return s;
}

/** Transferable buffers of a run (for postMessage). */
export function transferables(r: RunData): ArrayBuffer[] {
  const b: ArrayBuffer[] = [r.bathy.h.buffer as ArrayBuffer, r.etaMax.buffer as ArrayBuffer, r.arr.buffer as ArrayBuffer];
  for (const c of r.ck) b.push(c.eta.buffer as ArrayBuffer, c.M.buffer as ArrayBuffer, c.Nf.buffer as ArrayBuffer, c.mx.buffer as ArrayBuffer);
  for (const q of r.gauges) b.push(q.t.buffer as ArrayBuffer, q.v.buffer as ArrayBuffer);
  return b;
}
