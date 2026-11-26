/**
 * Linear shallow-water equations on the sphere, Arakawa C-grid, explicit forward–backward
 * (leap-frog-type) time stepping as in TUNAMI-N1 (Goto et al., 1997).
 *
 *   ∂η/∂t + 1/(R cosφ) [∂M/∂λ + ∂(N cosφ)/∂φ] = 0
 *   ∂M/∂t + g h/(R cosφ) ∂η/∂λ = 0
 *   ∂N/∂t + g h/R ∂η/∂φ = 0
 *
 * Reflective coasts (zero normal flux into dry cells) and a quadratic sponge at the open boundaries.
 * This module is free of DOM APIs so it runs both in a Web Worker and on the main thread.
 */
import { DOM, g, R_E } from "./constants";
import { hav, rad } from "./geo";
import type { Bathymetry } from "./bathymetry";
import type { Source } from "./source";

export interface State {
  eta: Float32Array;
  M: Float32Array;
  Nf: Float32Array;
  n: number;
}

export interface Solver {
  nx: number;
  ny: number;
  d: number;
  h: Float32Array;
  N: number;
  dt: number;
  hmax: number;
  wet: Uint8Array;
  wetCount: number;
  state(): State;
  step(S: State): void;
}

export const CFL = 0.85;
export const SPONGE_CELLS = 14;

export function makeSolver(B: Bathymetry): Solver {
  const { nx, ny, d, h } = B,
    N = nx * ny,
    dlam = rad(d),
    dphi = rad(d);
  const cosC = new Float64Array(ny),
    cosN = new Float64Array(ny),
    cosS = new Float64Array(ny);
  for (let j = 0; j < ny; j++) {
    const ph = rad(DOM.lat0 + j * d);
    cosC[j] = Math.cos(ph);
    cosN[j] = Math.cos(ph + dphi / 2);
    cosS[j] = Math.cos(ph - dphi / 2);
  }
  let hmax = 0;
  for (let k = 0; k < N; k++) if (h[k] > hmax) hmax = h[k];
  let dt = Infinity;
  for (let j = 0; j < ny; j++) {
    const dx = R_E * cosC[j] * dlam,
      dy = R_E * dphi;
    for (let i = 0; i < nx; i++) {
      const hh = h[j * nx + i];
      if (hh > 0) {
        const c = Math.sqrt(g * hh),
          lim = 1 / (c * Math.sqrt(1 / (dx * dx) + 1 / (dy * dy)));
        if (lim < dt) dt = lim;
      }
    }
  }
  dt = Math.floor(CFL * dt);
  const ax = new Float64Array(ny),
    ay = new Float64Array(ny);
  for (let j = 0; j < ny; j++) {
    ax[j] = dt / (R_E * cosC[j] * dlam);
    ay[j] = dt / (R_E * cosC[j] * dphi);
  }
  const cM = new Float32Array(N),
    cN = new Float32Array(N),
    wet = new Uint8Array(N);
  let wetCount = 0;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      wet[k] = h[k] > 0 ? 1 : 0;
      wetCount += wet[k];
      if (i < nx - 1 && h[k] > 0 && h[k + 1] > 0) cM[k] = (g * 0.5 * (h[k] + h[k + 1]) * dt) / (R_E * cosC[j] * dlam);
      if (j < ny - 1 && h[k] > 0 && h[k + nx] > 0) cN[k] = (g * 0.5 * (h[k] + h[k + nx]) * dt) / (R_E * dphi);
    }
  const spIdx: number[] = [],
    spF: number[] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const e = Math.min(i, j, nx - 1 - i, ny - 1 - j);
      if (e < SPONGE_CELLS && h[j * nx + i] > 0) {
        spIdx.push(j * nx + i);
        spF.push(1 - 0.12 * Math.pow((SPONGE_CELLS - e) / SPONGE_CELLS, 2));
      }
    }
  const spI = Int32Array.from(spIdx),
    spV = Float32Array.from(spF);

  const state = (): State => ({ eta: new Float32Array(N), M: new Float32Array(N), Nf: new Float32Array(N), n: 0 });

  function step(S: State) {
    const { eta, M, Nf } = S;
    // Continuity
    for (let j = 0; j < ny; j++) {
      const a = ax[j],
        b = ay[j],
        cn = cosN[j],
        cs = cosS[j],
        base = j * nx;
      for (let i = 0; i < nx; i++) {
        const k = base + i;
        if (!wet[k]) continue;
        const mw = i > 0 ? M[k - 1] : 0,
          ns = j > 0 ? Nf[k - nx] : 0;
        eta[k] -= a * (M[k] - mw) + b * (Nf[k] * cn - ns * cs);
      }
    }
    // Momentum (uses the updated η: forward–backward)
    for (let j = 0; j < ny; j++) {
      const base = j * nx;
      for (let i = 0; i < nx - 1; i++) {
        const k = base + i,
          c = cM[k];
        if (c) M[k] -= c * (eta[k + 1] - eta[k]);
      }
      if (j < ny - 1)
        for (let i = 0; i < nx; i++) {
          const k = base + i,
            c = cN[k];
          if (c) Nf[k] -= c * (eta[k + nx] - eta[k]);
        }
    }
    // Sponge
    for (let s = 0; s < spI.length; s++) {
      const k = spI[s],
        f = spV[s];
      eta[k] *= f;
      M[k] *= f;
      Nf[k] *= f;
    }
    S.n++;
  }
  return { nx, ny, d, h, N, dt, hmax, wet, wetCount, state, step };
}

export interface InitialCondition {
  peak: number;
  /** Net displaced volume (m³). */
  vol: number;
  sx: number;
  sy: number;
  /** Volume factor applied when the source had to be widened to the grid scale. */
  volF: number;
}

/**
 * Gaussian initial sea-surface displacement with mechanism-dependent shape:
 * thrust = uplift + trailing trough, normal = subsidence + flank uplift,
 * strike-slip = quadrupole with near-zero net volume.
 * Sources narrower than 2 cells are widened while conserving displaced volume.
 */
export function initialCondition(G: Solver, S: State, src: Source): InitialCondition {
  const { nx, ny, d } = G,
    cellKm = d * 111.19,
    smin = 2.0 * cellKm;
  const sx0 = src.L / 2.5,
    sy0 = src.W / 2.5,
    sx = Math.max(sx0, smin),
    sy = Math.max(sy0, smin);
  const volF = (sx0 * sy0) / (sx * sy);
  const A = src.A0 * volF,
    th = rad(src.strike),
    st = Math.sin(th),
    ct = Math.cos(th);
  const reach = 4 * Math.max(sx, sy) + src.W;
  const dLat = reach / 111.19,
    dLon = reach / (111.19 * Math.cos(rad(src.lat)));
  const j0 = Math.max(0, Math.floor((src.lat - dLat - DOM.lat0) / d)),
    j1 = Math.min(ny - 1, Math.ceil((src.lat + dLat - DOM.lat0) / d));
  const i0 = Math.max(0, Math.floor((src.lon - dLon - DOM.lon0) / d)),
    i1 = Math.min(nx - 1, Math.ceil((src.lon + dLon - DOM.lon0) / d));
  let peak = 0,
    vol = 0;
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const k = j * nx + i;
      if (!G.wet[k]) continue;
      const lat = DOM.lat0 + j * d,
        lon = DOM.lon0 + i * d;
      const ex = (lon - src.lon) * 111.19 * Math.cos(rad(src.lat)),
        ny_ = (lat - src.lat) * 111.19;
      const x = ex * st + ny_ * ct,
        y = ex * ct - ny_ * st; // x along strike, y toward dip
      const G1 = (yc: number, sy_: number) => Math.exp(-(x * x) / (sx * sx) - ((y - yc) * (y - yc)) / (sy_ * sy_));
      let v: number;
      if (src.mech === "thrust") v = G1(-0.2 * src.W, sy) - 0.35 * G1(0.55 * src.W, sy * 1.3);
      else if (src.mech === "normal") v = -G1(0.1 * src.W, sy) + 0.25 * G1(-0.55 * src.W, sy * 1.3);
      else {
        const r2 = (x * x) / (sx * sx) + (y * y) / (sy * sy);
        v = (4 * (x / sx) * (y / sy) * Math.exp(-r2)) / Math.exp(-1) / 2;
      }
      v *= A;
      S.eta[k] = v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
      vol += v * (cellKm * 1e3) * (cellKm * 1e3 * Math.cos(rad(lat)));
    }
  return { peak, vol, sx, sy, volF };
}

export interface GaugeSnap {
  k: number;
  h: number;
  dkm: number;
  lat: number;
  lon: number;
}

/** Snap a station to the nearest wet cell deeper than 30 m (else 10 m) within ~1.2°. */
export function snapGauge(G: Pick<Solver, "nx" | "ny" | "d" | "h">, lat: number, lon: number): GaugeSnap | null {
  const { nx, ny, d, h } = G;
  let best = -1,
    bd = 1e18;
  const ci = Math.round((lon - DOM.lon0) / d),
    cj = Math.round((lat - DOM.lat0) / d),
    R = Math.ceil(1.2 / d);
  for (const minH of [30, 10]) {
    for (let j = Math.max(0, cj - R); j <= Math.min(ny - 1, cj + R); j++)
      for (let i = Math.max(0, ci - R); i <= Math.min(nx - 1, ci + R); i++) {
        const k = j * nx + i;
        if (h[k] >= minH) {
          const dd = hav(lat, lon, DOM.lat0 + j * d, DOM.lon0 + i * d);
          if (dd < bd) {
            bd = dd;
            best = k;
          }
        }
      }
    if (best >= 0) break;
  }
  return best < 0
    ? null
    : { k: best, h: h[best], dkm: bd, lat: DOM.lat0 + Math.floor(best / nx) * d, lon: DOM.lon0 + (best % nx) * d };
}
