"use client";
import type { Progress, RunData } from "@/lib/physics/simulate";
import type { Params } from "@/lib/physics/source";

let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("../../workers/sim.worker.ts", import.meta.url), { type: "module" });
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

/**
 * Run the numerical model off the main thread. Starting a new run cancels the previous one.
 * Falls back to the main thread if Web Workers are unavailable.
 */
export function runSimulation(params: Params, onProgress: (p: Progress) => void): Promise<RunData | null> {
  const id = ++seq;
  const w = getWorker();
  if (!w) {
    return import("@/lib/physics/simulate").then((m) => m.simulate(params, onProgress, () => id !== seq));
  }
  return new Promise((resolve, reject) => {
    const onMsg = (e: MessageEvent) => {
      const m = e.data;
      if (m.id !== id) return;
      if (m.type === "progress") onProgress(m.p);
      else {
        w.removeEventListener("message", onMsg);
        w.removeEventListener("error", onErr);
        if (m.type === "done") resolve(m.run as RunData);
        else if (m.type === "cancelled") resolve(null);
        else reject(new Error(m.message));
      }
    };
    const onErr = (ev: ErrorEvent) => {
      w.removeEventListener("message", onMsg);
      w.removeEventListener("error", onErr);
      workerBroken = true;
      worker = null;
      console.warn("Simulation worker failed; running on the main thread.", ev.message);
      import("@/lib/physics/simulate").then((m) => m.simulate(params, onProgress, () => id !== seq)).then(resolve, reject);
    };
    w.addEventListener("message", onMsg);
    w.addEventListener("error", onErr);
    w.postMessage({ type: "run", id, params });
  });
}

export function cancelSimulation() {
  const id = seq;
  seq++;
  worker?.postMessage({ type: "cancel", id });
}
