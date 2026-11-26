/// <reference lib="webworker" />
import { simulate, transferables } from "@/lib/physics/simulate";
import type { Params } from "@/lib/physics/source";

type InMsg = { type: "run"; id: number; params: Params } | { type: "cancel"; id: number };

let current = 0;

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const m = e.data;
  if (m.type === "cancel") {
    if (m.id === current) current = -1;
    return;
  }
  current = m.id;
  const id = m.id;
  try {
    const run = await simulate(
      m.params,
      (p) => (self as DedicatedWorkerGlobalScope).postMessage({ type: "progress", id, p }),
      () => current !== id,
    );
    if (!run || current !== id) {
      (self as DedicatedWorkerGlobalScope).postMessage({ type: "cancelled", id });
      return;
    }
    // The bathymetry array is cached in this worker; send a copy so the cache is not detached.
    run.bathy = { ...run.bathy, h: run.bathy.h.slice() };
    (self as DedicatedWorkerGlobalScope).postMessage({ type: "done", id, run }, transferables(run));
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({ type: "error", id, message: String(err) });
  }
};
