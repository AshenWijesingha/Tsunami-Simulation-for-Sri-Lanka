"use client";
import Link from "next/link";
import { SCENARIOS, type ScenarioId } from "@/lib/physics/source";
import { fmtDur, fmtLen } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";
import { KV } from "@/components/ui/KV";

/**
 * Shows numerical-model values for a scenario. If no matching run exists in this session,
 * offers to compute one in the background (no map needed).
 */
export function LiveRun({ scen, show }: { scen: ScenarioId; show: "arrivals" | "summary" | "validation" }) {
  const run = useSim((s) => s.run);
  const running = useSim((s) => s.running);
  const progress = useSim((s) => s.progress);
  const have = run && run.params.scen === scen;

  const start = () => {
    const st = useSim.getState();
    st.setScenario(scen, { run: false });
    void st.runModel();
  };

  if (!have)
    return (
      <div className="card my-4 p-4 not-prose">
        <div className="eyebrow mb-1">Numerical model · {SCENARIOS[scen].label}</div>
        {running ? (
          <p className="note">
            Computing… {progress?.text} ({Math.round(progress ? (progress.phase === "bathy" ? progress.f * 30 : 30 + progress.f * 70) : 0)} %)
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" onClick={start}>
              ▶ Compute numerical values
            </button>
            <span className="note">Runs the shallow-water model in a background thread (a few seconds).</span>
          </div>
        )}
      </div>
    );

  const rows = slRows(run);
  const by = (n: string) => rows.find((r) => r.q.name === n);
  const mx = rows.reduce((a, b) => (b.hz > a.hz ? b : a), rows[0]);
  const meta = `${run.params.res}′ grid · ${run.bathy.live ? "ETOPO1" : "fallback"} bathymetry · Δt ${run.dt} s`;

  let kv: [string, string][] = [];
  if (show === "arrivals")
    kv = [
      ["Numerical first arrival, Colombo", fmtDur(by("Colombo")?.q.etaShore ?? NaN)],
      ["Analytic arrival, Colombo", fmtDur(by("Colombo")?.a.eta ?? NaN)],
      ["Numerical first arrival, Galle", fmtDur(by("Galle")?.q.etaShore ?? NaN)],
      ["Numerical first arrival, Trincomalee", fmtDur(by("Trincomalee")?.q.etaShore ?? NaN)],
    ];
  else if (show === "summary")
    kv = [
      ["Max numerical η offshore", fmtLen(Math.max(...rows.map((r) => r.q.max)))],
      ["Green's law → 1 m", fmtLen(Math.max(...rows.map((r) => r.q.green1 || 0)))],
      ["Abe (1981) H (max)", fmtLen(Math.max(...rows.map((r) => r.a.H81)))],
      ["Abe (1989) Ht (max)", fmtLen(Math.max(...rows.map((r) => r.a.H89)))],
      ["Governing estimate", `${fmtLen(mx.hz)} (${mx.q.name})`],
      ["Threat level", mx.lv.label],
      ["Margin below 0.3 m", `× ${Math.max(1, Math.floor(0.3 / mx.hz)).toLocaleString()}`],
    ];
  else
    kv = [
      ["Model first arrival, Batticaloa", fmtDur(by("Batticaloa")?.q.etaShore ?? NaN)],
      ["Model first arrival, Trincomalee", fmtDur(by("Trincomalee")?.q.etaShore ?? NaN)],
      ["Model first arrival, Galle", fmtDur(by("Galle")?.q.etaShore ?? NaN)],
      ["Model first arrival, Colombo", fmtDur(by("Colombo")?.q.etaShore ?? NaN)],
      ["Observed (Goff et al., 2006)", "≈ 2 h after origin (east coast)"],
    ];

  return (
    <div className="card my-4 p-4 not-prose">
      <div className="eyebrow mb-2">Numerical model · {SCENARIOS[scen].label}</div>
      <KV rows={kv} />
      <p className="note mt-2">
        {meta}. <Link href={`/simulator?scen=${scen}&tab=results`}>Open in simulator →</Link>
      </p>
    </div>
  );
}
