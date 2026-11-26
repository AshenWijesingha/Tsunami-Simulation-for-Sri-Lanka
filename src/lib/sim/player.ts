"use client";
import type { RunData } from "@/lib/physics/simulate";
import type { EtaImage } from "./render";

/**
 * Main-thread side of the playback worker. At most one seek is in flight; while it runs only the
 * newest target is remembered, so dragging the time slider never builds a backlog.
 */
export interface Frame {
  n: number;
  eta: Float32Array;
  img: EtaImage | null;
}

let worker: Worker | null = null;
let broken = false;
let runId = 0;
let ready = false;
let busy = false;
let pending: { n: number; sc: number | null } | null = null;
let last: { n: number; sc: number | null } | null = null;
let onFrame: ((f: Frame) => void) | null = null;
let onFail: (() => void) | null = null;

function getWorker(): Worker | null {
  if (broken || typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("../../workers/player.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.id !== runId) return;
        if (m.type === "ready") {
          ready = true;
          pump();
        } else if (m.type === "frame") {
          busy = false;
          onFrame?.({ n: m.n, eta: m.eta, img: m.rgba ? { rgba: m.rgba, sc: m.sc, n: m.n } : null });
          pump();
        } else if (m.type === "error") fail();
      };
      worker.onerror = () => fail();
    } catch {
      broken = true;
      return null;
    }
  }
  return worker;
}

function fail() {
  broken = true;
  worker?.terminate();
  worker = null;
  busy = false;
  onFail?.();
}

function pump() {
  if (!worker || !ready || busy || !pending) return;
  const p = pending;
  pending = null;
  if (last && last.n === p.n && last.sc === p.sc) return;
  busy = true;
  last = p;
  worker.postMessage({ type: "seek", id: runId, ...p });
}

/** Hand a finished run to the playback worker. Returns false when no worker is available. */
export function playerInit(run: RunData, handlers: { frame: (f: Frame) => void; fail: () => void }): boolean {
  const w = getWorker();
  if (!w) return false;
  onFrame = handlers.frame;
  onFail = handlers.fail;
  runId++;
  ready = false;
  busy = false;
  pending = null;
  last = null;
  // Structured clone copies the checkpoints, so the main thread keeps its own for the fallback path.
  w.postMessage({ type: "init", id: runId, bathy: run.bathy, ck: run.ck, nSteps: run.nSteps });
  return true;
}

/** Ask for the field at step n; `sc` (colour scale) also requests a painted η image. */
export function playerSeek(n: number, sc: number | null) {
  pending = { n, sc };
  pump();
}

export const playerActive = () => !!worker && !broken;
/** True while a frame is being computed (playback waits for it instead of drifting ahead). */
export const playerBusy = () => playerActive() && (busy || !ready);
