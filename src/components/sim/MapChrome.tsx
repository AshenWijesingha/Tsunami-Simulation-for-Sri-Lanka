"use client";
import { Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { C_KMMIN } from "@/lib/physics/constants";
import { SCENARIOS } from "@/lib/physics/source";
import { clockString, fmtLen } from "@/lib/format";
import { colorbarGradient, colorbarInfo } from "@/lib/sim/render";
import { liveMaxAbs, live, useSim, type Layer } from "@/lib/sim/store";
import { playerBusy } from "@/lib/sim/player";
import { slRows } from "@/lib/sim/derive";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/client";

const LAYERS: { k: Layer; key: string }[] = [
  { k: "eta", key: "1" },
  { k: "max", key: "2" },
  { k: "tt", key: "3" },
  { k: "bathy", key: "4" },
  { k: "off", key: "5" },
];

export function LayerBar() {
  const t = useT();
  const layer = useSim((s) => s.layer);
  const set = useSim((s) => s.set);
  return (
    <div className="glass absolute left-2.5 top-2.5 z-[5] flex gap-0.5 p-1 max-w-[calc(100%-260px)] max-lg:max-w-[calc(100%-64px)] max-lg:overflow-x-auto" role="toolbar" aria-label={t.sim.layers.aria}>
      {LAYERS.map((l) => (
        <button
          key={l.k}
          onClick={() => set("layer", l.k)}
          title={fmt(t.sim.layers.shortcut, { k: l.key })}
          aria-pressed={layer === l.k}
          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold ${layer === l.k ? "bg-accent-soft text-accent" : "text-fg-2 hover:bg-panel-2"}`}
        >
          {l.k === "max" ? (
            <>
              η<sub>max</sub>
            </>
          ) : (
            t.sim.layers[l.k]
          )}
        </button>
      ))}
    </div>
  );
}

export function Colorbar() {
  const t = useT();
  const layer = useSim((s) => s.layer);
  const run = useSim((s) => s.run);
  const scaleMul = useSim((s) => s.scaleMul);
  const set = useSim((s) => s.set);
  const info = colorbarInfo(layer, run, scaleMul);
  if (!info) return null;
  return (
    <div className="glass absolute bottom-[104px] left-2.5 z-[5] w-[236px] px-2.5 py-2 text-[0.75rem] max-lg:bottom-[150px] max-lg:w-[180px]">
      <div className="font-bold text-fg">{t.sim.colorbar[layer as "eta" | "max" | "tt" | "bathy"] ?? info.title}</div>
      <div className="my-1.5 h-3 rounded" style={{ background: colorbarGradient(layer) }} />
      <div className="flex justify-between tabular-nums text-muted">
        <span>{info.lo}</span>
        <span>{info.mid}</span>
        <span>{info.hi}</span>
      </div>
      {(layer === "eta" || layer === "max") && (
        <div className="mt-1.5 flex gap-1 max-lg:hidden">
          {[0.25, 0.5, 1, 2, 4].map((v) => (
            <button key={v} onClick={() => set("scaleMul", v)} className={`btn !min-h-0 !px-1.5 !py-0.5 !text-[0.72rem] ${scaleMul === v ? "btn-on" : ""}`}>
              {v === 1 ? t.sim.colorbar.auto : v < 1 ? `×${v === 0.25 ? "¼" : "½"}` : `×${v}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Playbar() {
  const tr = useT();
  const P = tr.sim.play;
  const run = useSim((s) => s.run);
  const t = useSim((s) => s.t);
  const playing = useSim((s) => s.playing);
  const playWhenReady = useSim((s) => s.playWhenReady);
  const running = useSim((s) => s.running);
  // Re-render when the playback worker delivers a new field (step counter, max |η|).
  useSim((s) => s.frame);
  const speed = useSim((s) => s.speed);
  const params = useSim((s) => s.params);
  const { seek, setPlaying, set } = useSim.getState();
  const dur = run ? run.params.dur : params.dur;
  const scen = SCENARIOS[run ? run.params.scen : params.scen];
  const trackRef = useRef<HTMLDivElement>(null);

  // animation loop
  useEffect(() => {
    if (!playing) return;
    let last: number | null = null,
      raf = 0;
    const frame = (ts: number) => {
      const s = useSim.getState();
      if (!s.playing || !s.run) return;
      // While the worker is still computing the previous frame, keep the clock running but send
      // nothing new: playback keeps the chosen speed and simply shows fewer frames on slow devices.
      // About 30 updates per second otherwise: smooth to the eye, half the repaints of 60 fps.
      if (playerBusy() || (last != null && ts - last < 30)) {
        if (last == null) last = ts;
        raf = requestAnimationFrame(frame);
        return;
      }
      if (last != null) {
        // Cap the step so a stalled tab or a very slow frame never jumps far ahead.
        let nt = s.t + Math.min(0.25, (ts - last) / 1000) * s.speed;
        if (nt >= s.run.params.dur) {
          nt = s.run.params.dur;
          s.seek(nt);
          s.setPlaying(false);
          return;
        }
        s.seek(nt);
      }
      last = ts;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const ticks = useMemo(() => {
    if (!run) return [];
    const ev: { t: number; l: string }[] = [];
    if (run.params.scen === "actual") ev.push({ t: 65, l: P.tickBulletin });
    const rows = slRows(run).filter((r) => Number.isFinite(r.q.etaShore));
    if (rows.length) ev.push({ t: rows.reduce((a, b) => (b.q.etaShore < a.q.etaShore ? b : a)).q.etaShore, l: P.tickFirst });
    for (const [n, l] of [["Colombo", P.tickColombo], ["Trincomalee", P.tickTrinco]]) {
      const q = run.gauges.find((g) => g.name === n);
      if (q && Number.isFinite(q.etaShore)) ev.push({ t: q.etaShore, l });
    }
    ev.sort((a, b) => a.t - b.t);
    // Drop labels that would collide: centres must be at least half of both labels apart
    // (about 6.5 px per character on a track of roughly 480 px), and never closer than 11 %.
    const out: typeof ev = [];
    for (const e of ev) {
      const prev = out[out.length - 1];
      const need = prev ? Math.max(0.11, ((prev.l.length + e.l.length) / 2) * 6.5 / 480 + 0.02) : 0;
      if (!prev || (e.t - prev.t) / run.params.dur > need) out.push(e);
    }
    return out;
  }, [run, P]);

  const maxEta = run ? liveMaxAbs() : 0;
  const step = live.n;

  return (
    <div className="glass absolute bottom-6 left-2.5 right-2.5 z-[5] flex items-center gap-3.5 px-3 py-2 max-lg:flex-wrap max-lg:gap-2">
      <div className="flex items-center gap-1.5">
        <button
          className="btn btn-primary h-9 w-11 !p-0 text-base"
          onClick={() => setPlaying(!(playing || playWhenReady))}
          disabled={!run && !running}
          title={P.playTitle}
          aria-label={playing || playWhenReady ? P.pause : P.play}
          aria-busy={playWhenReady}
        >
          {playWhenReady ? <Loader2 size={18} className="animate-spin" /> : playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button className="btn h-9 !px-2.5" onClick={() => { setPlaying(false); seek(0); }} title={P.rewind} aria-label={P.rewind}>
          <RotateCcw size={17} />
        </button>
        <select className="field h-9" value={speed} onChange={(e) => set("speed", +e.target.value)} aria-label={P.speed}>
          {[2, 5, 10, 20, 40].map((v) => (
            <option key={v} value={v}>
              {fmt(P.perSec, { n: v })}
            </option>
          ))}
        </select>
      </div>
      <div className="relative min-w-0 flex-1 pt-4 max-lg:order-3 max-lg:basis-full">
        <div ref={trackRef} className="pointer-events-none absolute inset-x-0 top-0 h-4">
          {ticks.map((e, i) =>
            e.t <= dur ? (
              <span
                key={i}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded bg-accent-soft px-1 text-[0.66rem] text-accent"
                style={{ left: `calc(8px + ${(e.t / dur) * 100}% - ${(e.t / dur) * 16}px)` }}
                title={`${e.l} · t = ${Math.round(e.t)} min`}
              >
                {e.l}
              </span>
            ) : null,
          )}
        </div>
        <input type="range" min={0} max={dur} step="any" value={t} onChange={(e) => seek(+e.target.value)} aria-label={P.time} disabled={!run} />
        <div className="truncate text-[0.74rem] tabular-nums text-muted">
          {run
            ? fmt(P.status, {
                s: step.toLocaleString("en-US"),
                n: run.nSteps.toLocaleString("en-US"),
                m: fmtLen(maxEta),
                r: Math.round(C_KMMIN * t).toLocaleString("en-US"),
              })
            : P.runFirst}
        </div>
      </div>
      {/* Fixed width: the slider must not resize while the clock text changes during playback. */}
      <div className="ml-auto w-[10.5rem] flex-none text-right max-lg:w-auto">
        <div className="whitespace-nowrap text-lg font-extrabold tabular-nums text-fg">{clockString(scen.clock.base, t, scen.clock.tz, true)}</div>
        <div className="truncate text-[0.74rem] tabular-nums text-muted" title={run?.params.scen === "actual" && t >= 65 ? P.bulletinIssued.replace(/^ · /, "") : undefined}>
          t = {t.toFixed(1)} min{run?.params.scen === "actual" && t >= 65 ? P.bulletinIssued : ""}
        </div>
      </div>
    </div>
  );
}
