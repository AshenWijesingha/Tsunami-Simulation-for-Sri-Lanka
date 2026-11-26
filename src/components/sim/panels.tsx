"use client";
import { Download, Loader2, Play, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { C_KMMIN, C_PATH, DOM, DONDRA, GREEN10 } from "@/lib/physics/constants";
import { fmtLat, fmtLon, hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, MECH, SCENARIOS, WHATIF_PRESETS, type Mechanism, type ScenarioId } from "@/lib/physics/source";
import { GAUGES, LEVELS } from "@/lib/physics/stations";
import { clockString, download, fmtDur, fmtLen, fmtSci } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";
import { KV, LevelPill, Section } from "@/components/ui/KV";
import { Chart, PALETTE } from "@/components/charts/Chart";
import { mapApi } from "./MapView";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/config";

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
  const t = useT();
  const S = t.sim;
  const M = S.model;

  return (
    <>
      <Section title={M.scenario}>
        <select className="field w-full" value={params.scen} onChange={(e) => setScenario(e.target.value as ScenarioId)} aria-label={M.scenario}>
          {Object.values(SCENARIOS).map((s) => (
            <option key={s.id} value={s.id}>
              {S.scenarios[s.id].label}
            </option>
          ))}
        </select>
        <p className="note mt-2">{S.scenarios[sc.id].note}</p>
        {params.scen === "whatif" && (
          <div className="mt-2.5">
            <label className="note block mb-1">{M.preset}</label>
            <select
              className="field w-full"
              value=""
              onChange={(e) => {
                const p = WHATIF_PRESETS.find((x) => x.id === e.target.value);
                if (p) setParams({ lat: p.lat, lon: p.lon, M: p.M, mech: p.mech, strike: p.strike });
              }}
              aria-label={M.preset}
            >
              <option value="">{M.choosePreset}</option>
              {WHATIF_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {(S.presets as Record<string, string>)[p.id] ?? p.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Section>

      <Section title={M.source}>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          <label className="text-muted" htmlFor="pM">{M.mw}</label>
          <div className="flex items-center gap-2">
            <input id="pM" type="range" min={6} max={9.3} step={0.1} value={params.M} disabled={sc.locked} onChange={(e) => setParams({ M: +e.target.value })} />
            <b className="w-9 tabular-nums">{params.M.toFixed(1)}</b>
          </div>
          <label className="text-muted" htmlFor="pMech">{M.mech}</label>
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
            <option value="normal">{M.mechOptions.normal}</option>
            <option value="strike">{M.mechOptions.strike}</option>
            <option value="thrust">{M.mechOptions.thrust}</option>
          </select>
          <label className="text-muted" htmlFor="pStrike">{M.strike}</label>
          <div className="flex items-center gap-2">
            <input id="pStrike" type="range" min={0} max={355} step={5} value={params.strike} onChange={(e) => setParams({ strike: +e.target.value })} />
            <b className="w-9 tabular-nums">{params.strike}</b>
          </div>
          <label className="text-muted">{M.centroid}</label>
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
                aria-label={M.latAria}
              />
              <input
                className="field w-[5.5rem]"
                type="number"
                step={0.1}
                min={DOM.lon0 + 3}
                max={DOM.lon1 - 3}
                value={params.lon}
                onChange={(e) => setParams({ lon: Math.max(DOM.lon0 + 3, Math.min(DOM.lon1 - 3, +e.target.value)) })}
                aria-label={M.lonAria}
              />
            </div>
          ) : (
            <span className="note">
              {fmtLat(params.lat)}, {fmtLon(params.lon)}
            </span>
          )}
          <label className="text-muted">{M.depth}</label>
          <span className="note">{M.depthNote}</span>
        </div>
        {params.scen === "actual" && (
          <p className="note mt-2.5">{M.actualNote}</p>
        )}
      </Section>

      <Section title={M.numerical}>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
          <label className="text-muted" htmlFor="pRes">{M.res}</label>
          <select id="pRes" className="field" value={params.res} onChange={(e) => setParams({ res: +e.target.value as 10 | 5 })}>
            <option value={10}>{M.res10}</option>
            <option value={5}>{M.res5}</option>
          </select>
          <label className="text-muted" htmlFor="pBathy">{M.bathy}</label>
          <select id="pBathy" className="field" value={params.bathy} onChange={(e) => setParams({ bathy: e.target.value as "auto" | "fallback" })}>
            <option value="auto">{M.bathyAuto}</option>
            <option value="fallback">{M.bathyFallback}</option>
          </select>
          <label className="text-muted" htmlFor="pDur">{M.duration}</label>
          <select id="pDur" className="field" value={params.dur} onChange={(e) => setParams({ dur: +e.target.value })}>
            {[300, 420, 540].map((v) => (
              <option key={v} value={v}>
                {fmt(M.hours, { n: v / 60 })}
              </option>
            ))}
          </select>
        </div>
        <button
          className={`btn mt-3 w-full ${dirty && !running ? "!border-warn !bg-warn !text-black" : "btn-primary"}`}
          onClick={() => runModel()}
          disabled={running}
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : dirty ? <RefreshCw size={16} /> : <Play size={16} fill="currentColor" />}
          {running ? M.runningBtn : dirty ? M.rerun : M.run}
        </button>
        {run && (
          <KV
            className="mt-3"
            rows={[
              [M.kv.grid, fmt(M.kv.cells, { nx: run.bathy.nx, ny: run.bathy.ny, n: (run.bathy.nx * run.bathy.ny).toLocaleString("en-US"), r: run.params.res })],
              [M.kv.wet, run.wetCount.toLocaleString("en-US")],
              [M.kv.dt, `${run.dt} s`],
              [M.kv.hmax, `${Math.round(run.hmax).toLocaleString("en-US")} m`],
              [M.kv.steps, run.nSteps.toLocaleString("en-US")],
              [M.kv.wall, `${run.wall.toFixed(2)} s`],
              [M.kv.bathymetry, run.bathy.live ? M.kv.etopo : M.kv.fallback],
              [
                M.kv.sourceGrid,
                run.ic.volF < 1
                  ? fmt(M.kv.widened, { a: run.ic.sx.toFixed(1), b: run.ic.sy.toFixed(1), p: fmtLen(run.ic.peak) })
                  : fmt(M.kv.resolved, { p: fmtLen(run.ic.peak) }),
              ],
            ]}
          />
        )}
      </Section>

      <Section title={M.derived}>
        <KV
          rows={[
            [M.dkv.L, `${src.L.toFixed(1)} km${src.prescribedLW ? ` ${M.dkv.prescribed}` : ""}`],
            [M.dkv.W, `${src.W.toFixed(1)} km${src.prescribedLW ? ` ${M.dkv.prescribed}` : ""}`],
            [M.dkv.Mo, `${fmtSci(src.Mo)} N·m`],
            [M.dkv.D, `${src.D.toFixed(2)} m`],
            [fmt(M.dkv.uplift, { k: MECH[src.mech].k }), fmtLen(src.uplift)],
            [M.dkv.kaj, src.kaj.toFixed(3)],
            [M.dkv.A0, fmtLen(src.A0)],
            [M.dkv.Mt, src.Mt.toFixed(2)],
          ]}
        />
      </Section>

      <Section title={M.wave}>
        <KV
          rows={[
            [M.wkv.c, `${(C_PATH * 3.6).toFixed(0)} km/h (${C_PATH.toFixed(0)} m/s)`],
            [M.wkv.lam, `${src.lam0.toFixed(0)} km`],
            [M.wkv.T, `${(src.T / 60).toFixed(1)} min`],
            [M.wkv.lamCoast, `${src.lamCoast.toFixed(2)} km`],
            [M.wkv.dist, `${Math.round(dSL).toLocaleString("en-US")} km`],
            [M.wkv.tt, fmtDur(dSL / C_KMMIN)],
            [M.wkv.green, `× ${GREEN10.toFixed(2)}`],
            [M.wkv.abe, `${fmtLen(abe81(dSL, src.Mt))} / ${fmtLen(abe89(dSL, src.Mt))}`],
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
  const t = useT();
  const Rs = t.sim.results;
  const place = (n: string) => t.places[n] ?? n;
  const lvl = (k: keyof typeof t.levels) => t.levels[k];
  if (!run) return <p className="p-4 note">{Rs.runFirst}</p>;
  const sc = SCENARIOS[run.params.scen];
  const withEta = rows.filter((r) => Number.isFinite(r.q.etaShore));
  const first = withEta.reduce((a, b) => (b.q.etaShore < a.q.etaShore ? b : a), withEta[0] ?? rows[0]);
  const mx = rows.reduce((a, b) => (b.hz > a.hz ? b : a), rows[0]);
  const R = mx.hz;
  const sorted = [...rows].sort((a, b) => (a.q.etaShore || 1e9) - (b.q.etaShore || 1e9));
  const bat = rows.find((r) => r.q.name === "Batticaloa") ?? first;

  return (
    <>
      <Section title={Rs.summary}>
        <KV
          rows={[
            [Rs.scenario, t.sim.scenarios[sc.id].label],
            [Rs.first, `${place(first.q.name)}, ${fmtDur(first.q.etaShore)} → ${clockString(sc.clock.base, first.q.etaShore, sc.clock.tz)}`],
            [Rs.maxCoastal, fmt(Rs.at, { h: fmtLen(mx.hz), s: place(mx.q.name) })],
            [Rs.numMax, `${fmtLen(Math.max(...rows.map((r) => r.q.max)))} → ${fmtLen(Math.max(...rows.map((r) => r.q.green1 || 0)))}`],
            [Rs.abeMax, fmtLen(Math.max(...rows.map((r) => r.a.H89)))],
            [Rs.threat, <LevelPill key="l" label={lvl(mx.lv.k)[0]} col={mx.lv.col} />],
          ]}
        />
        <div className={`callout mt-3 ${mx.lv.k === "none" ? "callout-info" : "callout-warn"}`}>
          {run.params.scen === "actual" ? (
            <>
              <b>{Rs.conclusionLabel}</b> {fmt(Rs.conclusion, { h: fmtLen(mx.hz) })}
            </>
          ) : run.params.scen === "v2004" ? (
            <>
              <b>{Rs.validationLabel}</b> {fmt(Rs.validation, { t: fmtDur(bat.q.etaShore), s: place(bat.q.name) })}
            </>
          ) : (
            <>
              <b>{Rs.hypoLabel}</b>{" "}
              {fmt(Rs.hypo, { m: run.src.M.toFixed(1), mech: t.sim.mech[run.src.mech], lvl: lvl(mx.lv.k)[0].toLowerCase(), desc: lvl(mx.lv.k)[1] })}
            </>
          )}
        </div>
      </Section>

      <Section title={Rs.stations}>
        <div className="max-h-[360px] overflow-auto -mx-1">
          <table className="tbl">
            <thead>
              <tr>
                <th>{Rs.th.station}</th>
                <th>{Rs.th.dist}</th>
                <th>{Rs.th.etaNum}</th>
                <th>{Rs.th.etaAnal}</th>
                <th>{Rs.th.etaOff}</th>
                <th>{Rs.th.hg}</th>
                <th>{Rs.th.eta1}</th>
                <th>{Rs.th.abe81}</th>
                <th>{Rs.th.abe89}</th>
                <th>{Rs.th.level}</th>
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
                  <td>{place(r.q.name)}</td>
                  <td>{Math.round(r.a.dist).toLocaleString("en-US")}</td>
                  <td>{fmtDur(r.q.etaShore)}</td>
                  <td>{fmtDur(r.a.eta)}</td>
                  <td>{fmtLen(r.q.max)}</td>
                  <td>{r.q.snap ? Math.round(r.q.snap.h) : "—"}</td>
                  <td>{fmtLen(r.q.green1)}</td>
                  <td>{fmtLen(r.a.H81)}</td>
                  <td>{fmtLen(r.a.H89)}</td>
                  <td>
                    <LevelPill label={lvl(r.lv.k)[0]} col={r.lv.col} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note mt-2">{Rs.tableNote}</p>
      </Section>

      <Section title={Rs.exposure}>
        <div className="flex flex-wrap gap-1.5">
          {(["off", "zones", "inund"] as const).map((k) => (
            <button
              key={k}
              className={`btn ${overlay === k ? "btn-on" : ""}`}
              onClick={() => {
                set("overlay", k);
                if (k !== "off" && (mapApi.map?.getZoom() ?? 0) < 8.5) mapApi.fly(6.05, 80.3, 10);
              }}
            >
              {Rs.overlays[k]}
            </button>
          ))}
        </div>
        <p className="note mt-2">
          {overlay === "off"
            ? Rs.overlayNote.off
            : overlay === "zones"
              ? Rs.overlayNote.zones
              : R < 0.01
                ? fmt(Rs.overlayNote.tooSmall, { r: fmtLen(R) })
                : fmt(Rs.overlayNote.inund, { r: R.toFixed(2), m: Math.round(Math.min(3000, Math.max(50, 250 * R))) })}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button className="btn" onClick={() => mapApi.fitSL()}>{Rs.zoom.sl}</button>
          <button className="btn" onClick={() => mapApi.fly(6.03, 80.35, 9.5)}>{Rs.zoom.south}</button>
          <button className="btn" onClick={() => mapApi.fly(7.6, 81.7, 9.2)}>{Rs.zoom.east}</button>
          <button className="btn" onClick={() => mapApi.fitDomain()}>{Rs.zoom.domain}</button>
        </div>
        <p className="note mt-2">
          {Object.keys(elev).length ? Rs.elevDem : Rs.elevApprox}
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
  const tr = useT();
  const G = tr.sim.gauges;
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
      xlabel={G.xlabel}
      ylabel={fmt(G.ylabel, { u: U.u })}
      series={qs.map((q, i) => ({ x: q.t, y: Array.from(q.v, (v) => v * U.f), color: PALETTE[i % PALETTE.length], w: 1.8 }))}
      vlines={[
        ...qs.filter((q) => Number.isFinite(q.arr)).map((q) => ({ v: q.arr, color: PALETTE[qs.indexOf(q) % PALETTE.length] })),
        { v: t, color: "var(--text)", label: G.now },
      ]}
      legendPos="tl"
      legend={qs.map((q, i) => ({ label: `${tr.places[q.name] ?? q.name} (h = ${Math.round(q.snap!.h)} m)`, color: PALETTE[i % PALETTE.length] }))}
      fy={(v) => v.toFixed(Math.abs(v) < 10 && v % 1 ? 2 : 0)}
    />
  );
}

export function GaugesPanel() {
  const run = useSim((s) => s.run);
  const sel = useSim((s) => s.gaugeSel);
  const { toggleGauge, set } = useSim.getState();
  const t = useT();
  const G = t.sim.gauges;
  return (
    <>
      <Section title={G.title} right={<button className="btn !min-h-0 !py-0.5 !px-2 !text-xs" onClick={() => set("gaugeSel", [])}>{G.clear}</button>}>
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.8rem]">
          {GAUGES.map((g) => (
            <label key={g.name} className="flex cursor-pointer items-center gap-1">
              <input type="checkbox" checked={sel.includes(g.name)} onChange={(e) => toggleGauge(g.name, e.target.checked)} />
              <span className={g.sl ? "" : "text-muted"}>{t.places[g.name] ?? g.name.replace(/,.*$/, "")}</span>
            </label>
          ))}
        </div>
        {run ? <GaugeChart /> : <p className="note">{G.runFirst}</p>}
        <p className="note mt-2">{G.note}</p>
      </Section>
      <ExportSection />
    </>
  );
}

export function ExportSection() {
  const run = useSim((s) => s.run);
  const rows = useMemo(() => slRows(run), [run]);
  const E = useT().sim.export;
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
    <Section title={E.title}>
      <div className="flex flex-wrap gap-1.5">
        <button className="btn" onClick={gaugesCsv}><Download size={15} /> {E.gauges}</button>
        <button className="btn" onClick={townsCsv}><Download size={15} /> {E.stations}</button>
        <button className="btn" onClick={meta}><Download size={15} /> {E.meta}</button>
        <button className="btn" onClick={etaMaxAsc}><Download size={15} /> {E.grid}</button>
      </div>
      <p className="note mt-2">{E.note}</p>
    </Section>
  );
}

/* ================= Runs (history, convergence) ================= */
export function RunsPanel() {
  const history = useSim((s) => s.history);
  const { clearHistory } = useSim.getState();
  const stations = ["Galle", "Colombo", "Batticaloa", "Trincomalee"];
  const t = useT();
  const Ru = t.sim.runs;
  return (
    <>
      <Section title={Ru.title} right={history.length ? <button className="btn !min-h-0 !py-0.5 !px-2 !text-xs" onClick={clearHistory}>{Ru.clear}</button> : null}>
        {history.length === 0 ? (
          <p className="note">{Ru.empty}</p>
        ) : (
          <div className="max-h-[420px] overflow-auto -mx-1">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{Ru.th.run}</th>
                  <th>{Ru.th.dt}</th>
                  <th>{Ru.th.wall}</th>
                  <th>{Ru.th.first}</th>
                  <th>{Ru.th.max}</th>
                  <th>{Ru.th.level}</th>
                  {stations.map((s) => (
                    <th key={s}>{fmt(Ru.th.eta, { s: t.places[s] ?? s })}</th>
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
                    <td>{(() => { const k = LEVELS.find((l) => l.label === h.level)?.k; return k ? t.levels[k][0] : h.level; })()}</td>
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
      <Section title={Ru.convTitle}>
        <p className="note">{Ru.convText}</p>
      </Section>
    </>
  );
}
