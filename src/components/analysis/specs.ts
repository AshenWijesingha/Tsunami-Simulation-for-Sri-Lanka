import type { ChartProps, Pt } from "@/components/charts/Chart";
import { C } from "@/components/charts/Chart";
import { DONDRA, g, H_PATH } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { abe81, abe89, MECH, SCENARIOS, type Mechanism, type Source } from "@/lib/physics/source";
import type { RunData } from "@/lib/physics/simulate";
import { TOWNS } from "@/lib/physics/stations";
import { cgNorm, cpNorm, type MCResult } from "@/lib/physics/waves";

const isSL = (n: string) => TOWNS.some((t) => t.name === n);
const range = (a: number, b: number, f: number) => {
  const o: number[] = [];
  for (let x = a; x <= b; x *= f) o.push(x);
  return o;
};
const lin = (a: number, b: number, s: number) => {
  const o: number[] = [];
  for (let x = a; x <= b + 1e-9; x += s) o.push(x);
  return o;
};

/** 1 · Amplitude decay with distance. */
export function decaySpec(src: Source, run?: RunData | null): ChartProps {
  const ds = range(100, 10000, 1.05);
  const pts: Pt[] = [];
  run?.gauges.forEach((q) => {
    if (q.snap && q.max > 0) {
      const col = isSL(q.name) ? C.s1 : C.s2;
      pts.push({ x: q.dist, y: q.max, color: col, r: 5, title: `${q.name}: offshore ${q.max.toExponential(2)} m` });
      pts.push({ x: q.dist, y: q.green1, color: col, fill: true, r: 5, title: `${q.name}: Green 1 m ${q.green1.toExponential(2)} m` });
    }
  });
  const allY = pts.map((p) => p.y).concat([abe89(100, src.Mt), abe81(10000, src.Mt)]);
  const ymin = Math.pow(10, Math.floor(Math.log10(Math.max(1e-6, Math.min(...allY) / 2))));
  const ymax = Math.pow(10, Math.ceil(Math.log10(Math.max(3.5, Math.max(...allY) * 2))));
  return {
    id: "decay",
    logx: true,
    logy: true,
    xlim: [100, 10000],
    ylim: [ymin, ymax],
    xlabel: "Distance from source Δ (km)",
    ylabel: "Amplitude (m)",
    series: [
      { x: ds, y: ds.map((d) => abe81(d, src.Mt)), color: C.s5 },
      { x: ds, y: ds.map((d) => abe89(d, src.Mt)), color: C.s4 },
    ],
    points: pts,
    hlines: [
      { v: 0.3, label: "0.3 m", color: C.warn },
      { v: 1, label: "1 m", color: C.orange },
      { v: 3, label: "3 m", color: C.bad },
    ],
    vlines: [{ v: hav(src.lat, src.lon, DONDRA.lat, DONDRA.lon), label: "Sri Lanka", color: C.muted }],
    legend: [
      { label: "Abe (1981) tide-gauge H", color: C.s5 },
      { label: "Abe (1989) run-up Ht", color: C.s4 },
      ...(run
        ? [
            { label: "Numerical, Sri Lanka (○ offshore, ● 1 m)", color: C.s1, kind: "dot" as const },
            { label: "Numerical, regional gauges", color: C.s2, kind: "dot" as const },
          ]
        : []),
    ],
    legendPos: "bl",
    title: "Tsunami amplitude versus distance",
  };
}

/** 2 · Travel time vs distance. */
export function travelSpec(run?: RunData | null): ChartProps {
  const dd = [0, 8000];
  const tt = (h: number) => dd.map((d) => (d * 1e3) / Math.sqrt(g * h) / 3600);
  const tp: Pt[] = [];
  run?.gauges.forEach((q) => {
    if (Number.isFinite(q.arr)) tp.push({ x: q.dist, y: q.arr / 60, color: isSL(q.name) ? C.s1 : C.s2, fill: true, r: 5, title: q.name });
  });
  if (run?.params.scen === "v2004") {
    const dSL = hav(SCENARIOS.v2004.lat, SCENARIOS.v2004.lon, 7.73, 81.68);
    tp.push({ x: dSL, y: 2.0, color: C.s3, r: 9, label: "Observed ≈ 2 h (2004)" });
  }
  return {
    id: "travel",
    xlim: [0, 8000],
    ylim: [0, Math.max(8, run ? run.params.dur / 60 : 7)],
    xlabel: "Great-circle distance (km)",
    ylabel: "Travel time (h)",
    series: [
      { x: dd, y: tt(3000), color: "#8ecae6", dash: "6 5" },
      { x: dd, y: tt(4000), color: C.text },
      { x: dd, y: tt(5000), color: "#8ecae6", dash: "6 5" },
    ],
    points: tp,
    legendPos: "tl",
    legend: [
      { label: "h = 4,000 m (713 km/h)", color: C.text },
      { label: "h = 3,000 / 5,000 m", color: "#8ecae6", kind: "dash" },
      ...(run ? [{ label: "Numerical arrivals (SL / regional)", color: C.s1, kind: "dot" as const }] : []),
    ],
    title: "Travel time versus distance",
  };
}

/** 3 · Frequency dispersion. */
export function dispersionSpec(kh: number): ChartProps {
  const xs = lin(0.01, 3, 0.01);
  return {
    id: "disp",
    xlim: [0, 3],
    ylim: [0, 1.05],
    xlabel: "kh (dimensionless wavenumber)",
    ylabel: "Speed / √(gh)",
    series: [
      { x: xs, y: xs.map(cpNorm), color: C.s1 },
      { x: xs, y: xs.map(cgNorm), color: C.s2 },
    ],
    points: [
      { x: kh, y: cpNorm(kh), color: C.s3, fill: true, r: 7, label: `c/c₀ = ${cpNorm(kh).toFixed(3)}` },
      { x: kh, y: cgNorm(kh), color: C.s3, r: 7, label: `c_g/c₀ = ${cgNorm(kh).toFixed(3)}` },
    ],
    vlines: [{ v: Math.PI / 10, label: "λ = 20h", color: C.muted }],
    legend: [
      { label: "Phase speed c", color: C.s1 },
      { label: "Group speed c_g", color: C.s2 },
    ],
    legendPos: "tr",
    fx: (v) => v.toFixed(1),
    fy: (v) => v.toFixed(1),
    title: "Linear dispersion: phase and group speed",
  };
}

export function dispersionNumbers(src: Source) {
  const dSL = hav(src.lat, src.lon, DONDRA.lat, DONDRA.lon);
  const c0 = Math.sqrt(g * H_PATH);
  const tL = (dSL * 1e3) / c0 / 60,
    tG = (dSL * 1e3) / (c0 * cgNorm(src.kh)) / 60;
  return { dSL, tL, tG, lamOverH: (src.lam0 * 1e3) / H_PATH };
}

/** 4 · Sensitivity to magnitude and mechanism at distance dkm. */
export const SENS_LABELS_EN = {
  xlabel: "Moment magnitude Mw",
  ylabel: "Run-up height Ht at Sri Lanka (m)",
  thrust: "Thrust",
  normal: "Normal",
  strike: "Strike-slip",
  marine: "0.3 m marine",
  land: "1 m land",
  major: "3 m major",
};

export function sensitivitySpec(dkm: number, Mmark: number, L: typeof SENS_LABELS_EN = SENS_LABELS_EN): ChartProps {
  const Ms = lin(6, 9.3, 0.05);
  const hS = (M: number, mech: Mechanism) => Math.pow(10, M + MECH[mech].adj - 5.55 - Math.log10(dkm));
  return {
    id: "sens",
    logy: true,
    xlim: [6, 9.3],
    ylim: [1e-4, 30],
    xlabel: L.xlabel,
    ylabel: L.ylabel,
    series: (["thrust", "normal", "strike"] as Mechanism[]).map((mc, i) => ({ x: Ms, y: Ms.map((M) => hS(M, mc)), color: [C.s3, C.s1, C.s4][i] })),
    hlines: [
      { v: 0.3, label: L.marine, color: C.warn },
      { v: 1, label: L.land, color: C.orange },
      { v: 3, label: L.major, color: C.bad },
    ],
    vlines: [{ v: Mmark, label: `M${Mmark.toFixed(1)}`, color: C.text }],
    legendPos: "tl",
    legend: [
      { label: L.thrust, color: C.s3 },
      { label: L.normal, color: C.s1 },
      { label: L.strike, color: C.s4 },
    ],
    fx: (v) => v.toFixed(1),
    title: "Run-up sensitivity to magnitude and mechanism",
  };
}

/** 5 · Monte Carlo histogram. */
export function mcSpec(mc: MCResult): ChartProps {
  const lo = -6,
    hi = 1,
    nb = 42,
    bw = (hi - lo) / nb,
    cnt = new Array(nb).fill(0);
  mc.amps.forEach((a) => {
    const b = Math.floor((Math.log10(a) - lo) / bw);
    if (b >= 0 && b < nb) cnt[b]++;
  });
  const mx = Math.max(...cnt, 1);
  return {
    id: "mc",
    logx: true,
    xlim: [1e-6, 10],
    ylim: [0, mx * 1.15],
    xlabel: "Tide-gauge amplitude H (m, log scale)",
    ylabel: "Samples",
    bars: cnt.map((c, i) => ({ x0: Math.pow(10, lo + i * bw), x1: Math.pow(10, lo + (i + 1) * bw), y: c, color: C.s1 })),
    vlines: [
      { v: mc.p.a50, label: "P50", color: C.s2 },
      { v: mc.p.a95, label: "P95", color: C.s3 },
      { v: 0.3, label: "0.3 m", color: C.warn },
    ],
    fy: (v) => String(Math.round(v)),
    title: "Monte Carlo distribution of tide-gauge amplitude",
  };
}
