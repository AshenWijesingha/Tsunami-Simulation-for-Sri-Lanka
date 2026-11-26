"use client";
import { create } from "zustand";
import { makeSolver, type Solver, type State } from "@/lib/physics/solver";
import type { Progress, RunData } from "@/lib/physics/simulate";
import { DEFAULT_PARAMS, SCENARIOS, type Params, type ScenarioId } from "@/lib/physics/source";
import { cancelSimulation, runSimulation } from "./client";
import { summarize, type RunSummary } from "./derive";
import { clampToDomain, zoneById } from "@/lib/physics/sources";
import { playerActive, playerInit, playerSeek } from "./player";
import type { EtaImage } from "./render";

export type Layer = "eta" | "max" | "tt" | "bathy" | "off";
export type Overlay = "off" | "zones" | "inund";

/**
 * Mutable playback state kept outside React for speed.
 *  eta — sea surface at step n (from the playback worker, or the main-thread fallback solver)
 *  img — the same frame pre-painted by the worker for the η layer
 *  G/S — main-thread solver, used only when Web Workers are unavailable
 */
export const live: { eta: Float32Array | null; n: number; img: EtaImage | null; G: Solver | null; S: State | null } = {
  eta: null,
  n: -1,
  img: null,
  G: null,
  S: null,
};

interface SimStore {
  params: Params;
  run: RunData | null;
  running: boolean;
  /** Increments with every model run started (lets the UI tell runs apart). */
  runSeq: number;
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
  /** Map pointer position for the point readout (null when the pointer is off the map). */
  hover: { lat: number; lon: number } | null;
  /** Waiting for a map click to place a custom epicentre. */
  picking: boolean;
  /** Show the source-zone catalogue on the map. */
  showZones: boolean;
  /** Set when the last placed epicentre had to be moved inside the model domain. */
  clamped: boolean;
  setParams(p: Partial<Params>): void;
  setScenario(s: ScenarioId, opts?: { keep?: boolean; run?: boolean }): void;
  runModel(): Promise<void>;
  /** Stop the running computation and keep the previous result. */
  cancelRun(): void;
  seek(t: number): void;
  setPlaying(p: boolean): void;
  /** Re-request the current frame (e.g. after the colour scale changed). */
  refreshFrame(): void;
  set<K extends keyof SimStore>(k: K, v: SimStore[K]): void;
  toggleGauge(name: string, on?: boolean): void;
  clearHistory(): void;
  /** Load a catalogue source zone (optionally at another magnitude) and run the model. */
  loadZone(id: string, M?: number): void;
  /** Put a custom (hypothetical) epicentre at a point, keeping magnitude and mechanism, and run the model. */
  placeSource(lat: number, lon: number, run?: boolean): void;
}

/** Colour scale the η layer is drawn with, or null when the η layer is hidden. */
function etaScale(s: { run: RunData | null; layer: Layer; scaleMul: number }) {
  return s.run && s.layer === "eta" ? s.run.scale * s.scaleMul : null;
}

/** Main-thread fallback: step the solver here (only when the playback worker is unavailable). */
function seekStep(run: RunData, n: number) {
  if (!live.G || !live.S) {
    live.G = makeSolver(run.bathy);
    live.S = live.G.state();
    live.n = -1;
  }
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
  L.eta = L.S!.eta;
  L.img = null;
}

let runCounter = 0;

export const useSim = create<SimStore>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  run: null,
  running: false,
  runSeq: 0,
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
  hover: null,
  picking: false,
  showZones: true,
  clamped: false,

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
    set((s) => ({ runSeq: s.runSeq + 1 }));
    set({ running: true, playing: false, progress: { phase: "bathy", f: 0, text: "Preparing…" }, error: null, dirty: false });
    try {
      const run = await runSimulation(params, (p) => set({ progress: p }));
      if (!run) return; // superseded by a newer run, or cancelled (cancelRun resets the state)
      live.G = live.S = null;
      live.eta = null;
      live.img = null;
      live.n = -1;
      const viaWorker = playerInit(run, {
        frame: (f) => {
          if (get().run !== run) return;
          live.eta = f.eta;
          live.n = f.n;
          live.img = f.img;
          set((s) => ({ frame: s.frame + 1 }));
        },
        fail: () => {
          // Worker died: continue on the main thread from the current time.
          const s = get();
          if (s.run) seekStep(s.run, Math.round((s.t * 60) / s.run.dt));
          set((x) => ({ frame: x.frame + 1 }));
        },
      });
      if (viaWorker) playerSeek(0, etaScale({ ...get(), run }));
      else seekStep(run, 0);
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

  cancelRun() {
    cancelSimulation();
    set({ running: false, progress: null, dirty: true });
  },

  seek(t) {
    const { run } = get();
    const max = run ? run.params.dur : get().params.dur;
    t = Math.max(0, Math.min(max, t));
    if (!run) return set({ t });
    const n = Math.round((t * 60) / run.dt);
    if (playerActive()) {
      // The worker answers asynchronously; the frame counter moves when the field arrives.
      set({ t });
      playerSeek(n, etaScale(get()));
    } else {
      seekStep(run, n);
      set((s) => ({ t, frame: s.frame + 1 }));
    }
  },

  refreshFrame() {
    const s = get();
    if (s.run && playerActive()) playerSeek(Math.round((s.t * 60) / s.run.dt), etaScale(s));
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

  loadZone(id, M) {
    const z = zoneById(id);
    if (!z) return;
    set({ picking: false, clamped: false });
    if (z.scenario && (M == null || M === z.M)) return get().setScenario(z.scenario);
    get().setScenario("whatif", { run: false });
    get().setParams({ lat: z.lat, lon: z.lon, M: M ?? z.M, mech: z.mech, strike: z.strike });
    void get().runModel();
  },

  placeSource(lat, lon, run = true) {
    const c = clampToDomain(lat, lon);
    const s = get();
    if (s.params.scen !== "whatif") s.setScenario("whatif", { keep: true, run: false });
    get().setParams({ lat: c.lat, lon: c.lon });
    set({ picking: false, clamped: c.clamped });
    if (run) void get().runModel();
  },
}));

/** Max |η| currently in the domain (sampled). */
export function liveMaxAbs(): number {
  const e = live.eta;
  if (!e) return 0;
  let mx = 0;
  for (let k = 0; k < e.length; k += 3) {
    const v = Math.abs(e[k]);
    if (v > mx) mx = v;
  }
  return mx;
}
