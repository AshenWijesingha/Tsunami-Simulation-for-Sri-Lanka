"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Chart, C } from "@/components/charts/Chart";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { buildSource, MECH, SCENARIOS, type Mechanism } from "@/lib/physics/source";
import { analyticTown, GROUPS, level, TOWNS } from "@/lib/physics/stations";
import { fmtLen } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";

/** Standard normal CDF (Abramowitz & Stegun 7.1.26 via erf). */
function Phi(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
const frag = (x: number, xm: number, b: number) => (x <= 0 ? 0 : Phi((Math.log(x) - Math.log(xm)) / b));

interface Klass {
  id: string;
  label: string;
  xm: number;
  beta: number;
  color: string;
}
const DEFAULT_CLASSES: Klass[] = [
  { id: "light", label: "Light timber / temporary", xm: 1.0, beta: 0.6, color: C.s3 },
  { id: "masonry", label: "Unreinforced masonry", xm: 2.0, beta: 0.6, color: C.s2 },
  { id: "rc", label: "Reinforced concrete", xm: 4.5, beta: 0.7, color: C.s1 },
];

export default function ImpactExplorer() {
  const run = useSim((s) => s.run);
  const elev = useSim((s) => s.elev);
  const [mode, setMode] = useState<"empirical" | "run">("empirical");
  const [M, setM] = useState(9.0);
  const [mech, setMech] = useState<Mechanism>("thrust");
  const [srcLoc, setSrcLoc] = useState<"sunda" | "ridge">("sunda");
  const [amp, setAmp] = useState(1);
  const [classes, setClasses] = useState(DEFAULT_CLASSES);

  const rows = useMemo(() => {
    if (mode === "run" && run) {
      return slRows(run).map((r) => ({ st: r.st, H: r.hz }));
    }
    const sc = srcLoc === "sunda" ? SCENARIOS.v2004 : SCENARIOS.actual;
    const src = buildSource({ scen: srcLoc === "sunda" ? "whatif" : "actual", lat: sc.lat, lon: sc.lon, M, mech, strike: sc.strike });
    return TOWNS.map((st) => {
      const a = analyticTown(st, src);
      return { st, H: a.H89 };
    });
  }, [mode, run, M, mech, srcLoc]);

  const table = rows.map((r) => {
    const H = r.H * amp;
    const z = elev[r.st.name] ?? r.st.elev ?? 0;
    const depth = Math.max(0, H - z);
    return { ...r, H, z, depth, p: classes.map((k) => frag(depth, k.xm, k.beta)), lv: level(H) };
  });

  const xs: number[] = [];
  for (let x = 0.05; x <= 10; x += 0.05) xs.push(x);

  return (
    <div className="grid gap-6">
      <div className="card p-5">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <div className="eyebrow mb-2">1 · Hazard</div>
            <div className="flex gap-1.5">
              <button className={`btn ${mode === "empirical" ? "btn-on" : ""}`} onClick={() => setMode("empirical")}>
                Empirical scenario
              </button>
              <button className={`btn ${mode === "run" ? "btn-on" : ""}`} onClick={() => setMode("run")} disabled={!run}>
                Latest model run
              </button>
            </div>
            {mode === "empirical" ? (
              <div className="mt-3 space-y-2 text-sm">
                <label className="block">
                  <span className="note">Source region</span>
                  <select className="field mt-1 w-full" value={srcLoc} onChange={(e) => setSrcLoc(e.target.value as "sunda" | "ridge")}>
                    <option value="sunda">Sunda megathrust (2004 location)</option>
                    <option value="ridge">Central Indian Ridge (2026 location)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="note">
                    M<sub>w</sub> <b className="text-fg">{M.toFixed(1)}</b>
                  </span>
                  <input type="range" min={7} max={9.3} step={0.1} value={M} onChange={(e) => setM(+e.target.value)} />
                </label>
                <label className="block">
                  <span className="note">Mechanism</span>
                  <select className="field mt-1 w-full" value={mech} onChange={(e) => setMech(e.target.value as Mechanism)}>
                    {(Object.keys(MECH) as Mechanism[]).map((m) => (
                      <option key={m} value={m}>
                        {MECH[m].label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="note">Coastal height = Abe (1989) local-mean run-up with the island-shelter factor.</p>
              </div>
            ) : (
              <p className="note mt-3">
                {run
                  ? `${SCENARIOS[run.params.scen].label}, M${run.src.M.toFixed(1)} ${MECH[run.src.mech].label}. Coastal height = max of Green's-law η and Abe (1989) Ht.`
                  : "No model run yet."}{" "}
                <Link href="/simulator">Open simulator</Link>
              </p>
            )}
            <label className="mt-3 block text-sm">
              <span className="note">
                Local amplification factor <b className="text-fg">× {amp.toFixed(1)}</b>
              </span>
              <input type="range" min={0.5} max={4} step={0.1} value={amp} onChange={(e) => setAmp(+e.target.value)} />
            </label>
            <p className="note">Represents bays, headlands and shelf resonance that a regional model cannot resolve. Run-up in 2004 varied by a factor of 2–3 over a few kilometres.</p>
          </div>
          <div className="md:col-span-2">
            <div className="eyebrow mb-2">2 · Vulnerability (lognormal fragility curves)</div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Building class</th>
                    <th>Median depth x<sub>m</sub> (m)</th>
                    <th>Dispersion β</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((k, i) => (
                    <tr key={k.id}>
                      <td>
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: k.color }} />
                        {k.label}
                      </td>
                      <td>
                        <input
                          className="field w-20 text-right"
                          type="number"
                          min={0.1}
                          max={20}
                          step={0.1}
                          value={k.xm}
                          onChange={(e) => setClasses(classes.map((c, j) => (j === i ? { ...c, xm: Math.max(0.1, +e.target.value) } : c)))}
                          aria-label={`${k.label} median depth`}
                        />
                      </td>
                      <td>
                        <input
                          className="field w-20 text-right"
                          type="number"
                          min={0.1}
                          max={2}
                          step={0.05}
                          value={k.beta}
                          onChange={(e) => setClasses(classes.map((c, j) => (j === i ? { ...c, beta: Math.max(0.1, +e.target.value) } : c)))}
                          aria-label={`${k.label} dispersion`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="callout callout-warn mt-3 text-sm">
              <b>Illustrative parameters.</b> The defaults only show the method and the ordering of vulnerability between building types; they are not
              calibrated for Sri Lanka. For research, replace them with curves fitted to survey data (the approach of Koshimura et al., 2009, and Suppasri
              et al., 2013) and cite their source.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartFrame title="Fragility curves: probability of severe damage" name="fragility">
          <Chart
            id="frag"
            xlim={[0, 10]}
            ylim={[0, 1]}
            xlabel="Inundation (flow) depth x (m)"
            ylabel="P(severe damage | x)"
            series={classes.map((k) => ({ x: xs, y: xs.map((x) => frag(x, k.xm, k.beta)), color: k.color }))}
            legend={classes.map((k) => ({ label: k.label, color: k.color }))}
            legendPos="br"
            fy={(v) => v.toFixed(1)}
            height={360}
          />
        </ChartFrame>
        <ChartFrame title="Coastal height by station" name="coastal-height">
          <Chart
            id="hz"
            logy
            xlim={[-0.5, table.length - 0.5]}
            ylim={[1e-4, 30]}
            xlabel="Stations, south → west → north → east"
            ylabel="Coastal height (m)"
            bars={table.map((r, i) => ({ x0: i - 0.4, x1: i + 0.4, y: Math.max(1e-4, r.H), color: r.lv.col }))}
            hlines={[
              { v: 0.3, label: "0.3 m", color: C.warn },
              { v: 1, label: "1 m", color: C.orange },
              { v: 3, label: "3 m", color: C.bad },
            ]}
            fx={(v) => (Number.isInteger(v) && table[v] ? table[v].st.name.slice(0, 3) : "")}
            height={360}
          />
        </ChartFrame>
      </div>

      <div className="card overflow-x-auto p-4">
        <div className="eyebrow mb-2">3 · Exposure and impact by station</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Station</th>
              <th>District</th>
              <th>Coast</th>
              <th>Coastal height</th>
              <th>Ground z (m)</th>
              <th>Flow depth</th>
              <th>Threat level</th>
              {classes.map((k) => (
                <th key={k.id}>P(damage) {k.label.split(" ")[0].toLowerCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.st.name}>
                <td>{r.st.name}</td>
                <td>{r.st.district}</td>
                <td>{r.st.group ? GROUPS[r.st.group] : ""}</td>
                <td>{fmtLen(r.H)}</td>
                <td>{r.z.toFixed(1)}</td>
                <td>{r.depth > 0 ? fmtLen(r.depth) : "—"}</td>
                <td>
                  <span className="pill" style={{ background: r.lv.col }}>
                    {r.lv.label}
                  </span>
                </td>
                {r.p.map((p, i) => (
                  <td key={i} style={{ color: p > 0.5 ? "var(--bad)" : p > 0.1 ? "var(--warn)" : undefined }}>
                    {(p * 100).toFixed(p > 0 && p < 0.01 ? 2 : 0)} %
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note mt-2">
          Flow depth = coastal height − ground elevation at the station point (a crude bathtub proxy; real flow depth varies strongly inland). Ground
          elevations come from the Copernicus GLO-90 DEM when the simulator has fetched them in this session, otherwise approximate values. Screening only:
          not for planning or evacuation decisions.
        </p>
      </div>
    </div>
  );
}
