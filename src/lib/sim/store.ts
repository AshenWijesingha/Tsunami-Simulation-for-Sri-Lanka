"use client";
import { create } from "zustand";
import { makeSolver, type Solver, type State } from "@/lib/physics/solver";
import type { Progress, RunData } from "@/lib/physics/simulate";
import { DEFAULT_PARAMS, SCENARIOS, type Params, type ScenarioId } from "@/lib/physics/source";
import { runSimulation } from "./client";
import { summarize, type RunSummary } from "./derive";

export type Layer = "eta" | "max" | "tt" | "bathy" | "off";
export type Overlay = "off" | "zones" | "inund";

/** Mutable playback state kept outside React for speed. */
export const live: { G: Solver | null; S: State | null; n: number } = { G: null, S: null, n: -1 };

interface SimStore {
  params: Params;
  run: RunData | null;
  running: boolean;
  progress: Progress | null;
  dirty: boolean;
  error: string | null;
  t: number;
  playing: boolean;
  speed: number;
  layer: Layer;
  scaleMul: number;
  overlay: Overlay;
  gaugeSel: string[];
  elev: Record<string, number>;
  /** Bumped every time the live field changes (drives map redraws). */
  frame: number;
  history: RunSummary[];
  setParams(p: Partial<Params>): void;
  setScenario(s: ScenarioId, opts?: { keep?: boolean; run?: boolean }): void;
  runModel(): Promise<void>;
  seek(t: number): void;
  setPlaying(p: boolean): void;
  set<K extends keyof SimStore>(k: K, v: SimStore[K]): void;
  toggleGauge(name: string, on?: boolean): void;
  clearHistory(): void;
}

function seekStep(run: RunData, n: number) {
  if (!live.G || !live.S) return;
  const L = live;
  n = Math.max(0, Math.min(run.nSteps, n));
  if (n < L.n || L.n < 0 || n - L.n > 300) {
    let c = run.ck[0];
    for (const k of run.ck) if (k.n <= n) c = k;
    if (!(L.n >= c.n && L.n <= n)) {
      L.S!.eta.set(c.eta);
      L.S!.M.set(c.M);
      L.S!.Nf.set(c.Nf);
      L.S!.n = c.n;
    }
  }
  while (L.S!.n < n) L.G!.step(L.S!);
  L.n = L.S!.n;
}

let runCounter = 0;

export const useSim = create<SimStore>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  run: null,
  running: false,
  progress: null,
  dirty: false,
  error: null,
  t: 0,
  playing: false,
  speed: 10,
  layer: "eta",
  scaleMul: 1,
  overlay: "off",
  gaugeSel: ["Galle", "Colombo", "Batticaloa", "Trincomalee"],
  elev: {},
  frame: 0,
  history: [],

  set: (k, v) => set({ [k]: v } as Partial<SimStore>),

  setParams(p) {
    set((s) => ({ params: { ...s.params, ...p }, dirty: true }));
  },

  setScenario(id, opts = {}) {
    const s = get();
    const sc = SCENARIOS[id];
    const params: Params = opts.keep
      ? { ...s.params, scen: id }
      : { ...s.params, scen: id, lat: sc.lat, lon: sc.lon, M: sc.M, mech: sc.mech, strike: sc.strike };
    set({ params, dirty: true });
    const rp = s.run?.params;
    const have =
      !!rp &&
      rp.scen === id &&
      rp.M === params.M &&
      rp.mech === params.mech &&
      rp.strike === params.strike &&
      rp.lat === params.lat &&
      rp.lon === params.lon &&
      rp.res === params.res &&
      rp.bathy === params.bathy &&
      rp.dur === params.dur;
    if (opts.run !== false && !have) void get().runModel();
    else if (have) set({ dirty: false });
  },

  async runModel() {
    const params = { ...get().params };
    set({ running: true, playing: false, progress: { phase: "bathy", f: 0, text: "Preparing…" }, error: null, dirty: false });
    try {
      const run = await runSimulation(params, (p) => set({ progress: p }));
      if (!run) return; // superseded by a newer run
      live.G = makeSolver(run.bathy);
      live.S = live.G.state();
      live.n = -1;
      seekStep(run, 0);
      const label = `#${++runCounter} ${SCENARIOS[run.params.scen].short} · M${run.src.M.toFixed(1)} ${run.src.mech} · ${run.params.res}′ · ${run.bathy.live ? "ETOPO1" : "fallback"}`;
      set((s) => ({
        run,
        running: false,
        progress: null,
        t: 0,
        frame: s.frame + 1,
        history: [summarize(run, label), ...s.history].slice(0, 12),
      }));
    } catch (e) {
      set({ running: false, progress: null, error: String(e) });
    }
  },

  seek(t) {
    const { run } = get();
    const max = run ? run.params.dur : get().params.dur;
    t = Math.max(0, Math.min(max, t));
    if (run) seekStep(run, Math.round((t * 60) / run.dt));
    set((s) => ({ t, frame: s.frame + 1 }));
  },

  setPlaying(p) {
    const { run, t } = get();
    if (p && !run) return;
    if (p && run && t >= run.params.dur) get().seek(0);
    set({ playing: p });
  },

  toggleGauge(name, on) {
    set((s) => {
      const has = s.gaugeSel.includes(name);
      const want = on ?? !has;
      if (want === has) return {};
      return { gaugeSel: want ? [...s.gaugeSel, name] : s.gaugeSel.filter((n) => n !== name) };
    });
  },

  clearHistory: () => set({ history: [] }),
}));

/** Max |η| currently in the domain (sampled). */
export function liveMaxAbs(): number {
  const e = live.S?.eta;
  if (!e) return 0;
  let mx = 0;
  for (let k = 0; k < e.length; k += 3) {
    const v = Math.abs(e[k]);
    if (v > mx) mx = v;
  }
  return mx;
}
