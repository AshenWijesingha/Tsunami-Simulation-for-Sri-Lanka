"use client";
import { useMemo } from "react";
import { C_KMMIN, C_PATH, DOM, DONDRA, GREEN10 } from "@/lib/physics/constants";
import { fmtLat, fmtLon, hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, MECH, SCENARIOS, WHATIF_PRESETS, type Mechanism, type ScenarioId } from "@/lib/physics/source";
import { GAUGES } from "@/lib/physics/stations";
import { clockString, download, fmtDur, fmtLen, fmtSci } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";
import { KV, LevelPill, Section } from "@/components/ui/KV";
import { Chart, PALETTE } from "@/components/charts/Chart";
import { mapApi } from "./MapView";

/* ================= Model ================= */
export function ModelPanel() {
  const params = useSim((s) => s.params);
  const run = useSim((s) => s.run);
  const running = useSim((s) => s.running);
  const dirty = useSim((s) => s.dirty);
  const { setParams, setScenario, runModel } = useSim.getState();
  const sc = SCENARIOS[params.scen];
  const src = useMemo(() => buildSource(params), [params]);
  const dSL = hav(src.lat, src.lon, DONDRA.lat, DONDRA.lon);
  const editableLoc = params.scen === "whatif";

  return (
    <>
      <Section title="Scenario">
        <select className="field w-full" value={params.scen} onChange={(e) => setScenario(e.target.value as ScenarioId)} aria-label="Scenario">
          {Object.values(SCENARIOS).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="note mt-2">{sc.note}</p>
        {params.scen === "whatif" && (
          <div className="mt-2.5">
            <label className="note block mb-1">Preset source</label>
            <select
              className="field w-full"
              value=""
              onChange={(e) => {
                const p = WHATIF_PRESETS.find((x) => x.id === e.target.value);
                if (p) setParams({ lat: p.lat, lon: p.lon, M: p.M, mech: p.mech, strike: p.strike });
              }}
              aria-label="Preset source"
            >
              <option value="">Choose a preset…</option>
              {WHATIF_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Section>

      <Section title="Source parameters">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          <label className="text-muted" htmlFor="pM">Moment magnitude M<sub>w</sub></label>
          <div className="flex items-center gap-2">
            <input id="pM" type="range" min={6} max={9.3} step={0.1} value={params.M} disabled={sc.locked} onChange={(e) => setParams({ M: +e.target.value })} />
            <b className="w-9 tabular-nums">{params.M.toFixed(1)}</b>
          </div>
          <label className="text-muted" htmlFor="pMech">Faulting mechanism</label>
          <select
            id="pMech"
            className="field"
            value={params.mech}
            disabled={params.scen === "v2004"}
            onChange={(e) => {
              const mech = e.target.value as Mechanism;
              setParams({ mech, strike: mech === "strike" && params.scen !== "whatif" ? 60 : params.strike });
            }}
          >
            <option value="normal">Normal (ridge segment)</option>
            <option value="strike">Strike-slip (transform)</option>
            <option value="thrust">Thrust (reverse)</option>
          </select>
          <label className="text-muted" htmlFor="pStrike">Strike (° from N)</label>
          <div className="flex items-center gap-2">
            <input id="pStrike" type="range" min={0} max={355} step={5} value={params.strike} onChange={(e) => setParams({ strike: +e.target.value })} />
            <b className="w-9 tabular-nums">{params.strike}</b>
          </div>
          <label className="text-muted">Centroid</label>
          {editableLoc ? (
            <div className="flex items-center gap-1.5">
              <input
                className="field w-[5.5rem]"
                type="number"
                step={0.1}
                min={DOM.lat0 + 3}
                max={DOM.lat1 - 3}
                value={params.lat}
                onChange={(e) => setParams({ lat: Math.max(DOM.lat0 + 3, Math.min(DOM.lat1 - 3, +e.target.value)) })}
                aria-label="Latitude (°N, negative = south)"
              />
              <input
                className="field w-[5.5rem]"
                type="number"
                step={0.1}
                min={DOM.lon0 + 3}
                max={DOM.lon1 - 3}
                value={params.lon}
                onChange={(e) => setParams({ lon: Math.max(DOM.lon0 + 3, Math.min(DOM.lon1 - 3, +e.target.value)) })}
                aria-label="Longitude (°E)"
              />
            </div>
          ) : (
            <span className="note">
              {fmtLat(params.lat)}, {fmtLon(params.lon)}
            </span>
          )}
          <label className="text-muted">Focal depth</label>
          <span className="note">Shallow; deformation assumed to reach the seafloor</span>
        </div>
        {params.scen === "actual" && (
          <p className="note mt-2.5">
            The bulletin gives no focal mechanism. The epicentre lies on the Central Indian Ridge, where events are typically normal faulting (spreading
            segments) or strike-slip (transforms). Normal faulting is the default; thrust is a deliberate upper bound.
          </p>
        )}
      </Section>

      <Section title="Numerical settings">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          <label className="text-muted" htmlFor="pRes">Grid resolution</label>
          <select id="pRes" className="field" value={params.res} onChange={(e) => setParams({ res: +e.target.value as 10 | 5 })}>
            <option value={10}>10′ (~18.5 km) · fast</option>
            <option value={5}>5′ (~9.3 km) · fine</option>
          </select>
          <label className="text-muted" htmlFor="pBathy">Bathymetry</label>
          <select id="pBathy" className="field" value={params.bathy} onChange={(e) => setParams({ bathy: e.target.value as "auto" | "fallback" })}>
            <option value="auto">Live ETOPO1 tiles, else fallback</option>
            <option value="fallback">Idealised (offline fallback)</option>
          </select>
          <label className="text-muted" htmlFor="pDur">Simulated duration</label>
          <select id="pDur" className="field" value={params.dur} onChange={(e) => setParams({ dur: +e.target.value })}>
            <option value={300}>5 h</option>
            <option value={420}>7 h</option>
            <option value={540}>9 h</option>
          </select>
        </div>
        <button
          className={`btn mt-3 w-full ${dirty && !running ? "!border-warn !bg-warn !text-black" : "btn-primary"}`}
          onClick={() => runModel()}
          disabled={running}
        >
          {running ? "Running…" : dirty ? "⟳ Parameters changed: re-run model" : "▶ Run numerical model"}
        </button>
        {run && (
          <KV
            className="mt-3"
            rows={[
              ["Grid", `${run.bathy.nx} × ${run.bathy.ny} = ${(run.bathy.nx * run.bathy.ny).toLocaleString()} cells (${run.params.res}′)`],
              ["Wet cells", run.wetCount.toLocaleString()],
              ["Δt (CFL 0.85)", `${run.dt} s`],
              ["h_max", `${Math.round(run.hmax).toLocaleString()} m`],
              ["Steps", run.nSteps.toLocaleString()],
              ["Wall-clock (worker)", `${run.wall.toFixed(2)} s`],
              ["Bathymetry", run.bathy.live ? "ETOPO1 (live tiles)" : "Idealised fallback"],
              [
                "Source on grid",
                run.ic.volF < 1 ? `widened to σ ${run.ic.sx.toFixed(1)}×${run.ic.sy.toFixed(1)} km (volume-conserving), peak ${fmtLen(run.ic.peak)}` : `resolved, peak ${fmtLen(run.ic.peak)}`,
              ],
            ]}
          />
        )}
      </Section>

      <Section title="Derived source (scaling relations)">
        <KV
          rows={[
            ["Rupture length L", `${src.L.toFixed(1)} km${src.prescribedLW ? " (prescribed)" : ""}`],
            ["Rupture width W", `${src.W.toFixed(1)} km${src.prescribedLW ? " (prescribed)" : ""}`],
            ["Seismic moment M₀", `${fmtSci(src.Mo)} N·m`],
            ["Mean slip D = M₀/(μLW)", `${src.D.toFixed(2)} m`],
            [`Vertical seafloor displacement (κ = ${MECH[src.mech].k})`, fmtLen(src.uplift)],
            ["Kajiura factor 1/cosh(kh)", src.kaj.toFixed(3)],
            ["Initial sea-surface amplitude A₀", fmtLen(src.A0)],
            ["Tsunami magnitude Mₜ (est.)", src.Mt.toFixed(2)],
          ]}
        />
      </Section>

      <Section title="Wave physics (path-averaged)">
        <KV
          rows={[
            ["c = √(gh), h = 4,000 m", `${(C_PATH * 3.6).toFixed(0)} km/h (${C_PATH.toFixed(0)} m/s)`],
            ["Characteristic wavelength λ₀", `${src.lam0.toFixed(0)} km`],
            ["Period T = λ₀/c", `${(src.T / 60).toFixed(1)} min`],
            ["Wavelength at h = 10 m", `${src.lamCoast.toFixed(2)} km`],
            ["Distance to Dondra Head", `${Math.round(dSL).toLocaleString()} km`],
            ["Analytic travel time", fmtDur(dSL / C_KMMIN)],
            ["Green's-law gain 4,000 → 10 m", `× ${GREEN10.toFixed(2)}`],
            ["Abe-81 H / Abe-89 Ht at Sri Lanka", `${fmtLen(abe81(dSL, src.Mt))} / ${fmtLen(abe89(dSL, src.Mt))}`],
          ]}
        />
      </Section>
    </>
  );
}

/* ================= Results ================= */
export function ResultsPanel() {
  const run = useSim((s) => s.run);
  const overlay = useSim((s) => s.overlay);
  const elev = useSim((s) => s.elev);
  const { set, toggleGauge } = useSim.getState();
  const rows = useMemo(() => slRows(run), [run]);
  if (!run) return <p className="p-4 note">Run the model to see results.</p>;
  const sc = SCENARIOS[run.params.scen];
  const withEta = rows.filter((r) => Number.isFinite(r.q.etaShore));
  const first = withEta.reduce((a, b) => (b.q.etaShore < a.q.etaShore ? b : a), withEta[0] ?? rows[0]);
  const mx = rows.reduce((a, b) => (b.hz > a.hz ? b : a), rows[0]);
  const R = mx.hz;
  const sorted = [...rows].sort((a, b) => (a.q.etaShore || 1e9) - (b.q.etaShore || 1e9));
  const bat = rows.find((r) => r.q.name === "Batticaloa") ?? first;

  return (
    <>
      <Section title="Sri Lanka: summary">
        <KV
          rows={[
            ["Scenario", sc.label],
            ["First arrival (numerical)", `${first.q.name}, ${fmtDur(first.q.etaShore)} → ${clockString(sc.clock.base, first.q.etaShore, sc.clock.tz)}`],
            ["Max coastal estimate", `${fmtLen(mx.hz)} at ${mx.q.name}`],
            ["Numerical max (offshore → 1 m)", `${fmtLen(Math.max(...rows.map((r) => r.q.max)))} → ${fmtLen(Math.max(...rows.map((r) => r.q.green1 || 0)))}`],
            ["Empirical Abe-89 Ht (max)", fmtLen(Math.max(...rows.map((r) => r.a.H89)))],
            ["Threat level (PTWC-style)", <LevelPill key="l" label={mx.lv.label} col={mx.lv.col} />],
          ]}
        />
        <div className={`callout mt-3 ${mx.lv.k === "none" ? "callout-info" : "callout-warn"}`}>
          {run.params.scen === "actual" ? (
            <>
              <b>Conclusion:</b> both the numerical and the empirical model predict coastal amplitudes in Sri Lanka of order {fmtLen(mx.hz)}, orders of
              magnitude below the 0.3 m information threshold and far below the normal tidal range. This is consistent with Bulletin No. 02 (no tsunami
              threat).
            </>
          ) : run.params.scen === "v2004" ? (
            <>
              <b>Validation:</b> compare the modelled first arrival on the east coast ({fmtDur(bat.q.etaShore)} at {bat.q.name}) with the observed ≈ 2 h
              (Goff et al., 2006). Amplitudes are only indicative: the idealised uniform-slip source and linear coastal extrapolation cannot reproduce the
              observed run-up of several metres to more than 10 m.
            </>
          ) : (
            <>
              <b>Hypothetical:</b> M{run.src.M.toFixed(1)} {MECH[run.src.mech].label} gives {mx.lv.label.toLowerCase()} ({mx.lv.desc})
            </>
          )}
        </div>
      </Section>

      <Section title="Coastal stations: numerical vs empirical">
        <div className="max-h-[360px] overflow-auto -mx-1">
          <table className="tbl">
            <thead>
              <tr>
                <th>Station</th>
                <th>Δ km</th>
                <th>ETA num.</th>
                <th>ETA anal.</th>
                <th>η off.</th>
                <th>h<sub>g</sub> m</th>
                <th>η 1 m</th>
                <th>H Abe81</th>
                <th>H<sub>t</sub> Abe89</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.q.name}
                  className="cursor-pointer hover:bg-accent-soft"
                  onClick={() => {
                    mapApi.openGauge(r.q.name);
                    toggleGauge(r.q.name, true);
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && mapApi.openGauge(r.q.name)}
                >
                  <td>{r.q.name}</td>
                  <td>{Math.round(r.a.dist).toLocaleString()}</td>
                  <td>{fmtDur(r.q.etaShore)}</td>
                  <td>{fmtDur(r.a.eta)}</td>
                  <td>{fmtLen(r.q.max)}</td>
                  <td>{r.q.snap ? Math.round(r.q.snap.h) : "—"}</td>
                  <td>{fmtLen(r.q.green1)}</td>
                  <td>{fmtLen(r.a.H81)}</td>
                  <td>{fmtLen(r.a.H89)}</td>
                  <td>
                    <LevelPill label={r.lv.label} col={r.lv.col} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note mt-2">
          ETA num.: first |η| ≥ 5 % of the gauge maximum plus shelf transit to shore. η off.: max η at the offshore grid cell (depth h<sub>g</sub>). η 1 m:
          Green&apos;s-law extrapolation to 1 m depth. H Abe81: empirical tide-gauge amplitude. H<sub>t</sub> Abe89: empirical local-mean run-up. Level uses the
          larger of η 1 m and H<sub>t</sub>. Click a row to locate the station.
        </p>
      </Section>

      <Section title="Coastal exposure: elevation overlays">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["off", "Off"],
              ["zones", "Low-lying land 0–10 m"],
              ["inund", "Flooding at max run-up"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={`btn ${overlay === k ? "btn-on" : ""}`}
              onClick={() => {
                set("overlay", k);
                if (k !== "off" && (mapApi.map?.getZoom() ?? 0) < 8.5) mapApi.fly(6.05, 80.3, 10);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="note mt-2">
          {overlay === "off"
            ? "Open terrain tiles (SRTM-based, about ±5 m vertical error). Zoom in on the coast, and turn on 3D terrain for relief."
            : overlay === "zones"
              ? "Coastal land 0–2 m (red), 2–5 m (orange) and 5–10 m (yellow) above sea level."
              : R < 0.01
                ? `Max run-up for this scenario is ${fmtLen(R)}, far below DEM resolution, so no land is shaded.`
                : `Blue: land hydraulically connected to the sea with z ≤ ${R.toFixed(2)} m, at most ${Math.round(Math.min(3000, Math.max(50, 250 * R)))} m inland. A bathtub approximation, not an inundation model.`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button className="btn" onClick={() => mapApi.fitSL()}>Sri Lanka</button>
          <button className="btn" onClick={() => mapApi.fly(6.03, 80.35, 9.5)}>South coast</button>
          <button className="btn" onClick={() => mapApi.fly(7.6, 81.7, 9.2)}>East coast</button>
          <button className="btn" onClick={() => mapApi.fitDomain()}>Whole domain</button>
        </div>
        <p className="note mt-2">
          Station elevations: {Object.keys(elev).length ? "Copernicus GLO-90 DEM via Open-Meteo (shoreline points can read 0–2 m)." : "approximate values (live DEM lookup unavailable or pending)."}
        </p>
      </Section>
    </>
  );
}

/* ================= Gauges ================= */
function niceUnit(m: number) {
  if (m < 0.01) return { f: 1000, u: "mm" };
  if (m < 1) return { f: 100, u: "cm" };
  return { f: 1, u: "m" };
}

export function GaugeChart({ height = 380 }: { height?: number }) {
  const run = useSim((s) => s.run);
  const sel = useSim((s) => s.gaugeSel);
  const t = useSim((s) => s.t);
  if (!run) return null;
  const qs = run.gauges.filter((q) => sel.includes(q.name) && q.snap);
  let m = 0;
  qs.forEach((q) => (m = Math.max(m, q.maxAbs)));
  m = m || 1e-3;
  const U = niceUnit(m);
  return (
    <Chart
      id="gauges"
      height={height}
      xlim={[0, run.params.dur]}
      ylim={[-m * U.f * 1.1, m * U.f * 1.1]}
      xlabel="Time after origin (min)"
      ylabel={`η (${U.u})`}
      series={qs.map((q, i) => ({ x: q.t, y: Array.from(q.v, (v) => v * U.f), color: PALETTE[i % PALETTE.length], w: 1.8 }))}
      vlines={[
        ...qs.filter((q) => Number.isFinite(q.arr)).map((q) => ({ v: q.arr, color: PALETTE[qs.indexOf(q) % PALETTE.length] })),
        { v: t, color: "var(--text)", label: "now" },
      ]}
      legendPos="tl"
      legend={qs.map((q, i) => ({ label: `${q.name} (h = ${Math.round(q.snap!.h)} m)`, color: PALETTE[i % PALETTE.length] }))}
      fy={(v) => v.toFixed(Math.abs(v) < 10 && v % 1 ? 2 : 0)}
    />
  );
}

export function GaugesPanel() {
  const run = useSim((s) => s.run);
  const sel = useSim((s) => s.gaugeSel);
  const { toggleGauge, set } = useSim.getState();
  return (
    <>
      <Section title="Synthetic tide gauges" right={<button className="btn !py-0.5 !px-2 !text-xs" onClick={() => set("gaugeSel", [])}>Clear</button>}>
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.8rem]">
          {GAUGES.map((g) => (
            <label key={g.name} className="flex cursor-pointer items-center gap-1">
              <input type="checkbox" checked={sel.includes(g.name)} onChange={(e) => toggleGauge(g.name, e.target.checked)} />
              <span className={g.sl ? "" : "text-muted"}>{g.name.replace(/,.*$/, "")}</span>
            </label>
          ))}
        </div>
        {run ? <GaugeChart /> : <p className="note">Run the model first.</p>}
        <p className="note mt-2">Dashed lines mark detected first arrivals; the vertical &ldquo;now&rdquo; line follows the playback clock. Click a station on the map to add it.</p>
      </Section>
      <ExportSection />
    </>
  );
}

export function ExportSection() {
  const run = useSim((s) => s.run);
  const rows = useMemo(() => slRows(run), [run]);
  if (!run) return null;
  const tag = `${run.params.scen}_M${run.src.M.toFixed(1)}_${run.src.mech}_${run.params.res}min`;
  const gaugesCsv = () => {
    const gs = run.gauges.filter((q) => q.snap);
    const n = gs[0].t.length;
    let s = "t_min," + gs.map((q) => `"${q.name} eta_m"`).join(",") + "\n";
    for (let i = 0; i < n; i++) s += gs[0].t[i].toFixed(3) + "," + gs.map((q) => q.v[i].toExponential(5)).join(",") + "\n";
    download(`gauges_${tag}.csv`, s, "text/csv");
  };
  const townsCsv = () => {
    let s = "station,district,lat,lon,dist_km,eta_num_shore_min,eta_num_offshore_min,eta_analytic_min,eta_max_offshore_m,gauge_depth_m,green_1m_m,abe81_H_m,abe89_Ht_m,sheltered,level\n";
    rows.forEach((r) => {
      const q = r.q;
      s +=
        [
          `"${q.name}"`,
          r.st.district ?? "",
          r.st.lat,
          r.st.lon,
          r.a.dist.toFixed(1),
          q.etaShore.toFixed(2),
          q.arr.toFixed(2),
          r.a.eta.toFixed(2),
          q.max.toExponential(4),
          q.snap ? q.snap.h.toFixed(0) : "",
          q.green1.toExponential(4),
          r.a.H81.toExponential(4),
          r.a.H89.toExponential(4),
          r.a.shelter,
          `"${r.lv.label}"`,
        ].join(",") + "\n";
    });
    download(`stations_${tag}.csv`, s, "text/csv");
  };
  const meta = () =>
    download(
      `run_${tag}.json`,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          software: "Indian Ocean Tsunami Lab (LSWE, C-grid, forward–backward)",
          scenario: run.params.scen,
          params: run.params,
          source: run.src,
          grid: { nx: run.bathy.nx, ny: run.bathy.ny, res_arcmin: run.params.res, dt_s: run.dt, steps: run.nSteps, hmax_m: run.hmax, domain: DOM, cfl: 0.85, sponge_cells: 14 },
          bathymetry: run.bathy.src,
          initial_condition: run.ic,
          wallclock_s: run.wall,
          gauges: run.gauges.map((q) => ({ name: q.name, cell: q.snap, dist_km: q.dist, arrival_offshore_min: q.arr, arrival_shore_min: q.etaShore, max_m: q.max, green1m_m: q.green1 })),
        },
        null,
        1,
      ),
      "application/json",
    );
  const etaMaxAsc = () => {
    const { nx, ny, d } = run.bathy;
    let s = `ncols ${nx}\nnrows ${ny}\nxllcenter ${DOM.lon0}\nyllcenter ${DOM.lat0}\ncellsize ${d}\nNODATA_value -9999\n`;
    for (let j = ny - 1; j >= 0; j--) {
      const row: string[] = [];
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        row.push(run.bathy.h[k] > 0 ? run.etaMax[k].toExponential(3) : "-9999");
      }
      s += row.join(" ") + "\n";
    }
    download(`etamax_${tag}.asc`, s, "text/plain");
  };
  return (
    <Section title="Export data">
      <div className="flex flex-wrap gap-1.5">
        <button className="btn" onClick={gaugesCsv}>⬇ Gauge time series (CSV)</button>
        <button className="btn" onClick={townsCsv}>⬇ Station table (CSV)</button>
        <button className="btn" onClick={meta}>⬇ Run metadata (JSON)</button>
        <button className="btn" onClick={etaMaxAsc}>⬇ η<sub>max</sub> grid (ESRI ASCII)</button>
      </div>
      <p className="note mt-2">The ESRI ASCII grid opens directly in QGIS or ArcGIS (WGS 84, cell centres).</p>
    </Section>
  );
}

/* ================= Runs (history, convergence) ================= */
export function RunsPanel() {
  const history = useSim((s) => s.history);
  const { clearHistory } = useSim.getState();
  const stations = ["Galle", "Colombo", "Batticaloa", "Trincomalee"];
  return (
    <>
      <Section title="Run history" right={history.length ? <button className="btn !py-0.5 !px-2 !text-xs" onClick={clearHistory}>Clear</button> : null}>
        {history.length === 0 ? (
          <p className="note">Completed runs appear here so you can compare scenarios, resolutions and bathymetry sources.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto -mx-1">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Δt s</th>
                  <th>Wall s</th>
                  <th>1st arrival</th>
                  <th>Max η 1 m</th>
                  <th>Level</th>
                  {stations.map((s) => (
                    <th key={s}>{s} ETA</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="max-w-[260px] truncate" title={h.label}>{h.label}</td>
                    <td>{h.dt}</td>
                    <td>{h.wall.toFixed(1)}</td>
                    <td>{fmtDur(h.firstArrival)}</td>
                    <td>{fmtLen(h.maxGreen)}</td>
                    <td>{h.level}</td>
                    {stations.map((s) => (
                      <td key={s}>{fmtDur(h.stations[s]?.eta ?? NaN)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section title="Convergence study">
        <p className="note">
          A credible numerical result needs a resolution check. Run the same scenario at 10′ and 5′ and compare. For the sub-grid M6.5 source the far-field
          amplitude is <i>not</i> grid-converged (the source is widened to the grid scale), while arrival times typically change by only a few minutes.
          Arrival times are governed by bathymetry; amplitudes by source resolution and dispersion.
        </p>
      </Section>
    </>
  );
}
