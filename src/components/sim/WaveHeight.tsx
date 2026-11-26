"use client";
import { useMemo } from "react";
import { DOM, DONDRA } from "@/lib/physics/constants";
import { greatCircle, hav } from "@/lib/physics/geo";
import type { RunData } from "@/lib/physics/simulate";
import { fmtDur, fmtLen } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { live, useSim } from "@/lib/sim/store";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/client";
import { Section } from "@/components/ui/KV";

const LEVEL_COLOR: Record<string, string> = { none: "#2ec27e", marine: "#f6c343", land: "#f08a24", major: "#e5484d" };

/** Model grid cell at a point, or -1 outside the domain. */
function cellAt(run: RunData, lat: number, lon: number) {
  const { nx, ny, d } = run.bathy;
  const i = Math.round((lon - DOM.lon0) / d),
    j = Math.round((lat - DOM.lat0) / d);
  if (i < 0 || j < 0 || i >= nx || j >= ny) return -1;
  return j * nx + i;
}

/** Live readout of η, ηmax, depth and first arrival under the map pointer. */
export function PointReadout() {
  const t = useT();
  const H = t.sim.height;
  const run = useSim((s) => s.run);
  const hover = useSim((s) => s.hover);
  useSim((s) => s.frame); // re-render as the wave field advances
  if (!run || !hover) return null;
  const k = cellAt(run, hover.lat, hover.lon);
  if (k < 0) return null;
  const depth = run.bathy.h[k];
  const wet = depth > 0;
  const eta = live.S?.eta[k] ?? 0;
  const arr = run.arr[k];
  return (
    <div className="glass pointer-events-none absolute bottom-[104px] right-2.5 z-[6] w-[230px] p-3 text-[0.8rem] max-lg:bottom-[150px]" role="status" aria-live="off">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="eyebrow !text-[0.64rem]">{H.readoutTitle}</span>
        <span className="tabular-nums text-[0.7rem] text-muted">
          {Math.abs(hover.lat).toFixed(2)}° {hover.lat < 0 ? "S" : "N"}, {hover.lon.toFixed(2)}° E
        </span>
      </div>
      {wet ? (
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
          <dt className="text-muted">{H.etaNow}</dt>
          <dd className="text-right font-bold tabular-nums" style={{ color: eta > 0 ? "#e5484d" : eta < 0 ? "#2f7ff0" : undefined }}>
            {eta >= 0 ? "+" : "−"}
            {fmtLen(Math.abs(eta))}
          </dd>
          <dt className="text-muted">{H.etaMax}</dt>
          <dd className="text-right font-semibold tabular-nums">{fmtLen(run.etaMax[k])}</dd>
          <dt className="text-muted">{H.depth}</dt>
          <dd className="text-right font-semibold tabular-nums">{Math.round(depth).toLocaleString("en-US")} m</dd>
          <dt className="text-muted">{H.arrival}</dt>
          <dd className="text-right font-semibold tabular-nums">{Number.isFinite(arr) ? fmtDur(arr) : H.notYet}</dd>
        </dl>
      ) : (
        <div className="font-semibold text-fg-2">{H.land}</div>
      )}
    </div>
  );
}

/** Ocean cross-section along the great circle from the source to Dondra Head. */
export function WaveProfile() {
  const t = useT();
  const H = t.sim.height;
  const run = useSim((s) => s.run);
  const tNow = useSim((s) => s.t);
  useSim((s) => s.frame);
  const transect = useMemo(() => {
    if (!run) return null;
    const pts = greatCircle(run.src.lat, run.src.lon, DONDRA.lat, DONDRA.lon, 260);
    const D = hav(run.src.lat, run.src.lon, DONDRA.lat, DONDRA.lon);
    return pts.map(([lon, lat], i) => {
      const k = cellAt(run, lat, lon);
      return { x: (D * i) / (pts.length - 1), k, h: k >= 0 ? run.bathy.h[k] : 0 };
    });
  }, [run]);
  if (!run || !transect) return <p className="note">{t.sim.gauges.runFirst}</p>;

  const W = 460,
    Hh = 300,
    padL = 8,
    padR = 8;
  const yS = 120; // still-water line
  const yB = 285; // deepest seafloor drawn
  const D = transect.at(-1)!.x;
  const X = (x: number) => padL + (x / D) * (W - padL - padR);
  const env = transect.map((p) => (p.k >= 0 && p.h > 0 ? run.etaMax[p.k] : 0));
  const cur = transect.map((p) => (p.k >= 0 && p.h > 0 ? (live.S?.eta[p.k] ?? 0) : 0));
  const A = Math.max(1e-6, ...env, ...cur.map(Math.abs));
  const waveAmp = 78; // px for amplitude A
  const Yeta = (e: number) => yS - (e / A) * waveAmp;
  const hMax = 6500;
  const Yh = (h: number) => yS + (Math.min(h, hMax) / hMax) * (yB - yS);
  const exaggeration = waveAmp / A / ((yB - yS) / hMax);

  const line = (vals: number[]) => transect.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Yeta(vals[i]).toFixed(1)}`).join("");
  const floor = transect.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Yh(p.h).toFixed(1)}`).join("");
  const water = `${line(cur)}L${X(D).toFixed(1)} ${Yh(transect.at(-1)!.h).toFixed(1)}${transect
    .slice()
    .reverse()
    .map((p) => `L${X(p.x).toFixed(1)} ${Yh(p.h).toFixed(1)}`)
    .join("")}Z`;
  const ground = `${floor}L${X(D)} ${Hh}L${X(0)} ${Hh}Z`;
  // Drop ticks that would collide with the end-of-path distance label.
  const ticks = [0, 1000, 2000, 3000, 4000, 5000].filter((v) => v < D * 0.88);
  const sig = (v: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.round(v / p) * p;
  };

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${Hh + 24}`} className="w-full rounded-xl border border-line" role="img" aria-label={H.profileTitle} style={{ background: "var(--chart-bg)" }}>
        <defs>
          <linearGradient id="wp-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4cc9f0" stopOpacity=".55" />
            <stop offset="1" stopColor="#0A2463" stopOpacity=".85" />
          </linearGradient>
        </defs>
        <path d={water} fill="url(#wp-water)" />
        <path d={ground} fill="#5b4a3a" fillOpacity=".85" />
        <path d={floor} fill="none" stroke="#8d7457" strokeWidth="1" />
        <line x1={X(0)} x2={X(D)} y1={yS} y2={yS} stroke="var(--chart-axis)" strokeDasharray="4 4" />
        <path d={line(env)} fill="none" stroke="#ffd166" strokeWidth="1.4" strokeDasharray="5 3" />
        <path d={line(cur)} fill="none" stroke="#fff" strokeWidth="2" />
        <path d={line(cur)} fill="none" stroke="#e5484d" strokeWidth="1" strokeOpacity=".9" />
        {/* labels */}
        <g fontFamily="var(--font-sans)" fontSize="10.5" fill="var(--text-2)">
          <text x={X(0) + 2} y={14}>
            {fmt(H.scale, { h: fmtLen(A) })} · t = {tNow.toFixed(0)} min
          </text>
          <text x={X(D) - 2} y={14} textAnchor="end">
            {t.places["Dondra Head"] ?? "Dondra Head"}
          </text>
          <text x={X(4)} y={yB + 4} fill="#f4e7d3">
            {H.seafloor}
          </text>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={X(v)} x2={X(v)} y1={Hh} y2={Hh + 4} stroke="var(--chart-axis)" />
              <text x={X(v)} y={Hh + 16} textAnchor="middle" fill="var(--muted)">
                {v.toLocaleString("en-US")}
              </text>
            </g>
          ))}
          <text x={X(D)} y={Hh + 16} textAnchor="end" fill="var(--muted)">
            {Math.round(D).toLocaleString("en-US")} km
          </text>
        </g>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-5 rounded bg-[#e5484d]" /> {H.current}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t-2 border-dashed border-[#ffd166]" /> {H.envelope}
        </span>
        <span className="text-muted">
          {H.distance} · {fmt(H.exaggeration, { x: sig(exaggeration).toLocaleString("en-US") })}
        </span>
      </figcaption>
    </figure>
  );
}

/** Coastal wave height per station on a log scale with threat thresholds. */
export function CoastalHeights() {
  const t = useT();
  const run = useSim((s) => s.run);
  useSim((s) => s.frame);
  const rows = useMemo(() => slRows(run), [run]);
  if (!run) return null;
  const lo = -4,
    hi = 1; // 0.1 mm … 10 m
  const pos = (h: number) => Math.max(0, Math.min(1, (Math.log10(Math.max(h, 1e-6)) - lo) / (hi - lo))) * 100;
  const nowMax = Math.max(0, ...rows.map((r) => (r.q.snap ? Math.abs(live.S?.eta[r.q.snap.k] ?? 0) : 0)));
  const nowAt = rows.reduce((a, r) => (r.q.snap && Math.abs(live.S?.eta[r.q.snap.k] ?? 0) > Math.abs(live.S?.eta[a.q.snap?.k ?? 0] ?? 0) ? r : a), rows[0]);
  const ever = rows.reduce((a, r) => (r.hz > a.hz ? r : a), rows[0]);
  const place = (n: string) => t.places[n] ?? n;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-panel-2 p-3">
          <div className="text-[0.72rem] text-muted">{t.sim.height.highestNow}</div>
          <div className="mt-1 text-lg font-extrabold tabular-nums text-fg">{fmtLen(nowMax)}</div>
          <div className="text-[0.72rem] text-muted">
            {place(nowAt.q.name)} · {t.sim.height.offshore}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel-2 p-3">
          <div className="text-[0.72rem] text-muted">{t.sim.height.highestEver}</div>
          <div className="mt-1 text-lg font-extrabold tabular-nums text-fg">{fmtLen(ever.hz)}</div>
          <div className="text-[0.72rem] text-muted">
            {place(ever.q.name)} · {t.sim.height.coastal}
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5" aria-label={t.sim.height.title}>
        {rows.map((r) => (
          <li key={r.q.name} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_4.6rem] items-center gap-2 text-[0.78rem]">
            <span className="truncate text-fg-2" title={place(r.q.name)}>
              {place(r.q.name)}
            </span>
            <span className="relative h-3.5 rounded-full bg-panel-2">
              {[0.3, 1, 3].map((v) => (
                <span key={v} className="absolute top-[-2px] h-[18px] w-px bg-[var(--chart-axis)]" style={{ left: `${pos(v)}%` }} aria-hidden />
              ))}
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos(r.hz)}%`, background: LEVEL_COLOR[r.lv.k] }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-fg">{fmtLen(r.hz)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_4.6rem] gap-2 text-[0.68rem] text-muted">
        <span />
        <span className="relative h-4">
          {[
            [1e-4, "0.1 mm"],
            [1e-2, "1 cm"],
            [0.3, "0.3 m"],
            [3, "3 m"],
          ].map(([v, l]) => (
            <span key={l as string} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${pos(v as number)}%` }}>
              {l}
            </span>
          ))}
        </span>
        <span />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["none", "marine", "land", "major"] as const).map((k) => (
          <span key={k} className="pill" style={{ background: LEVEL_COLOR[k] }}>
            {t.levels[k][0]}
          </span>
        ))}
      </div>
    </>
  );
}

export function WaveHeightPanel() {
  const t = useT();
  const H = t.sim.height;
  const run = useSim((s) => s.run);
  return (
    <>
      <Section title={H.profileTitle}>
        <p className="note mb-3">{H.profileLead}</p>
        <WaveProfile />
      </Section>
      <Section title={H.title}>
        <p className="note mb-3">{H.lead}</p>
        {run ? <CoastalHeights /> : <p className="note">{t.sim.gauges.runFirst}</p>}
        <p className="note mt-3">{H.note}</p>
      </Section>
      <Section title={H.readoutTitle}>
        <p className="note">{H.readoutHint}</p>
      </Section>
    </>
  );
}
