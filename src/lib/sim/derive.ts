import type { GaugeResult, RunData } from "@/lib/physics/simulate";
import { analyticTown, GAUGES, level, TOWNS, type AnalyticResult, type Station, type ThreatLevel } from "@/lib/physics/stations";

export interface SLRow {
  q: GaugeResult;
  st: Station;
  a: AnalyticResult;
  /** Governing coastal estimate: max of Abe-89 Ht and Green's-law η (m). */
  hz: number;
  lv: ThreatLevel;
}

const byName = new Map(GAUGES.map((s) => [s.name, s]));
export const stationByName = (n: string) => byName.get(n)!;

export function slRows(run: RunData | null): SLRow[] {
  if (!run) return [];
  return run.gauges
    .filter((q) => TOWNS.some((t) => t.name === q.name))
    .map((q) => {
      const st = stationByName(q.name);
      const a = analyticTown(st, run.src);
      const hz = Math.max(a.H89, Number.isFinite(q.green1) ? q.green1 : 0);
      return { q, st, a, hz, lv: level(hz) };
    });
}

export interface RunSummary {
  id: string;
  label: string;
  scen: string;
  M: number;
  mech: string;
  res: number;
  bathy: string;
  dt: number;
  nSteps: number;
  wall: number;
  firstName: string;
  firstArrival: number;
  maxName: string;
  maxHz: number;
  maxGreen: number;
  maxAbe89: number;
  level: string;
  /** Per-station shore arrival (min) and Green's-law amplitude (m). */
  stations: Record<string, { eta: number; green1: number; max: number }>;
}

export function summarize(run: RunData, label: string): RunSummary {
  const rows = slRows(run);
  const withEta = rows.filter((r) => Number.isFinite(r.q.etaShore));
  const first = withEta.length ? withEta.reduce((a, b) => (b.q.etaShore < a.q.etaShore ? b : a)) : rows[0];
  const mx = rows.reduce((a, b) => (b.hz > a.hz ? b : a), rows[0]);
  const stations: RunSummary["stations"] = {};
  for (const r of rows) stations[r.q.name] = { eta: r.q.etaShore, green1: r.q.green1, max: r.q.max };
  return {
    id: run.id,
    label,
    scen: run.params.scen,
    M: run.src.M,
    mech: run.src.mech,
    res: run.params.res,
    bathy: run.bathy.live ? "ETOPO1" : "fallback",
    dt: run.dt,
    nSteps: run.nSteps,
    wall: run.wall,
    firstName: first?.q.name ?? "—",
    firstArrival: first?.q.etaShore ?? NaN,
    maxName: mx?.q.name ?? "—",
    maxHz: mx?.hz ?? NaN,
    maxGreen: Math.max(0, ...rows.map((r) => r.q.green1 || 0)),
    maxAbe89: Math.max(0, ...rows.map((r) => r.a.H89)),
    level: mx?.lv.label ?? "—",
    stations,
  };
}
