/// <reference lib="webworker" />
/**
 * Playback worker: holds the solver state and checkpoints of the current run and steps the model to
 * whatever time the UI asks for, so seeking and playing never block the main thread.
 * Replies with a copy of η and, when asked, the η layer already painted as RGBA.
 */
import type { Bathymetry } from "@/lib/physics/bathymetry";
import type { Checkpoint } from "@/lib/physics/simulate";
import { makeSolver, type Solver, type State } from "@/lib/physics/solver";
import { ensureRowMap, paintEta } from "@/lib/sim/render";

type InMsg =
  | { type: "init"; id: number; bathy: Bathymetry; ck: Checkpoint[]; nSteps: number }
  | { type: "seek"; id: number; n: number; sc: number | null };

let G: Solver | null = null;
let S: State | null = null;
let ck: Checkpoint[] = [];
let nSteps = 0;
let runId = -1;
let bathy: Bathymetry | null = null;

function restore(c: Checkpoint) {
  S!.eta.set(c.eta);
  S!.M.set(c.M);
  S!.Nf.set(c.Nf);
  S!.n = c.n;
}

function stepTo(n: number) {
  n = Math.max(0, Math.min(nSteps, n));
  let c = ck[0];
  for (const k of ck) if (k.n <= n) c = k;
  // Restart from a checkpoint when going backwards, or when it saves work.
  if (n < S!.n || c.n > S!.n) restore(c);
  while (S!.n < n) G!.step(S!);
}

self.onmessage = (e: MessageEvent<InMsg>) => {
  const m = e.data;
  const post = (msg: unknown, t: Transferable[] = []) => (self as DedicatedWorkerGlobalScope).postMessage(msg, t);
  try {
    if (m.type === "init") {
      runId = m.id;
      bathy = m.bathy;
      ck = m.ck;
      nSteps = m.nSteps;
      G = makeSolver(bathy);
      S = G.state();
      restore(ck[0]);
      post({ type: "ready", id: runId });
      return;
    }
    if (m.id !== runId || !G || !S || !bathy) return;
    stepTo(m.n);
    const eta = S.eta.slice();
    const out: { type: "frame"; id: number; n: number; eta: Float32Array; rgba?: Uint8ClampedArray; sc?: number } = { type: "frame", id: runId, n: S.n, eta };
    const transfer: Transferable[] = [eta.buffer];
    if (m.sc != null) {
      const rm = ensureRowMap(bathy.ny, bathy.d);
      const rgba = new Uint8ClampedArray(bathy.nx * rm.length * 4);
      paintEta(rgba, eta, bathy.h, bathy.nx, rm, m.sc);
      out.rgba = rgba;
      out.sc = m.sc;
      transfer.push(rgba.buffer);
    }
    post(out, transfer);
  } catch (err) {
    post({ type: "error", id: runId, message: String(err) });
  }
};
