"use client";
import { Play } from "lucide-react";
import Link from "@/i18n/Link";
import { useMemo, useState } from "react";
import { Chart } from "@/components/charts/Chart";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { KV } from "@/components/ui/KV";
import { DONDRA } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, MECH, mwForHeight, SCENARIOS, type Mechanism, type ScenarioId } from "@/lib/physics/source";
import { cgNorm, cpNorm, DEFAULT_MC, runMonteCarlo, type MCConfig, type MCResult } from "@/lib/physics/waves";
import { fmtDur, fmtLen } from "@/lib/format";
import { useSim } from "@/lib/sim/store";
import { decaySpec, dispersionNumbers, dispersionSpec, mcSpec, sensitivitySpec, travelSpec } from "./specs";

export default function Workbench() {
  const run = useSim((s) => s.run);
  const [scen, setScen] = useState<ScenarioId>("actual");
  const [M, setM] = useState(6.5);
  const [mech, setMech] = useState<Mechanism>("normal");
  const [useRun, setUseRun] = useState(true);
  const sc = SCENARIOS[scen];
  const src = useMemo(() => buildSource({ scen, lat: sc.lat, lon: sc.lon, M, mech, strike: sc.strike }), [scen, sc, M, mech]);
  const shown = useRun ? run : null;
  const dSL = hav(src.lat, src.lon, DONDRA.lat, DONDRA.lon);
  const dn = dispersionNumbers(src);

  const [cfg, setCfg] = useState<MCConfig>(DEFAULT_MC);
  const [mc, setMc] = useState<MCResult | null>(null);
  const runMC = () => setMc(runMonteCarlo(cfg));

  const decay = decaySpec(src, shown);
  const travel = travelSpec(shown);
  const disp = dispersionSpec(src.kh);
  const sens = sensitivitySpec(dSL, M);

  const setScenario = (s: ScenarioId) => {
    setScen(s);
    setM(SCENARIOS[s].M);
    setMech(SCENARIOS[s].mech);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 self-start space-y-4">
        <div className="card p-4">
          <div className="eyebrow mb-3">Source</div>
          <label className="note block mb-1" htmlFor="aScen">Location</label>
          <select id="aScen" className="field w-full" value={scen} onChange={(e) => setScenario(e.target.value as ScenarioId)}>
            <option value="actual">Central Indian Ridge (24 Nov 2026 epicentre)</option>
            <option value="v2004">Sumatra–Andaman (2004 source)</option>
          </select>
          <label className="note mt-3 block" htmlFor="aM">Moment magnitude M<sub>w</sub>: <b className="text-fg">{M.toFixed(1)}</b></label>
          <input id="aM" type="range" min={6} max={9.3} step={0.1} value={M} onChange={(e) => setM(+e.target.value)} />
          <label className="note mt-3 block" htmlFor="aMech">Mechanism</label>
          <select id="aMech" className="field w-full" value={mech} onChange={(e) => setMech(e.target.value as Mechanism)}>
            <option value="normal">Normal</option>
            <option value="strike">Strike-slip</option>
            <option value="thrust">Thrust</option>
          </select>
          <KV
            className="mt-4"
            rows={[
              ["Distance to Dondra Head", `${Math.round(dSL).toLocaleString()} km`],
              ["Mₜ", src.Mt.toFixed(2)],
              ["Abe-81 H", fmtLen(abe81(dSL, src.Mt))],
              ["Abe-89 Ht", fmtLen(abe89(dSL, src.Mt))],
              ["λ₀ / kh", `${src.lam0.toFixed(0)} km / ${src.kh.toFixed(2)}`],
            ]}
          />
        </div>
        <div className="card p-4">
          <div className="eyebrow mb-2">Numerical results</div>
          {run ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useRun} onChange={(e) => setUseRun(e.target.checked)} /> Overlay the latest model run
              </label>
              <p className="note mt-1.5">
                {SCENARIOS[run.params.scen].label} · M{run.src.M.toFixed(1)} {MECH[run.src.mech].label} · {run.params.res}′ ·{" "}
                {run.bathy.live ? "ETOPO1" : "fallback bathymetry"}
              </p>
            </>
          ) : (
            <p className="note">
              No model run in this session yet. <Link href="/simulator">Run the simulator</Link> to overlay numerical gauge results on charts 1 and 2.
            </p>
          )}
        </div>
        <div className="card p-4">
          <div className="eyebrow mb-2">Magnitude thresholds at Sri Lanka</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ht reaches</th>
                <th>Thrust</th>
                <th>Normal</th>
                <th>Strike-slip</th>
              </tr>
            </thead>
            <tbody>
              {[0.3, 1, 3].map((h) => (
                <tr key={h}>
                  <td>{h} m</td>
                  {(["thrust", "normal", "strike"] as Mechanism[]).map((m) => (
                    <td key={m}>{mwForHeight(h, dSL, m) > 9.3 ? "> M9.3" : `M${mwForHeight(h, dSL, m).toFixed(1)}`}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note mt-2">Abe (1989) inverted at Δ = {Math.round(dSL).toLocaleString()} km. “&gt; M9.3” means no plausible earthquake of that type reaches the height.</p>
        </div>
      </aside>

      <div className="grid gap-6 min-w-0">
        <ChartFrame
          title="1 · Amplitude decay with distance"
          name="decay"
          csv={() => {
            let s = "distance_km,abe81_H_m,abe89_Ht_m\n";
            for (let d = 100; d <= 10000; d *= 1.1) s += `${d.toFixed(1)},${abe81(d, src.Mt).toExponential(4)},${abe89(d, src.Mt).toExponential(4)}\n`;
            return s;
          }}
          caption={
            <>
              Log–log. Lines: Abe (1981) tide-gauge amplitude and Abe (1989) run-up height for M<sub>w</sub> {M.toFixed(1)} {MECH[mech].label}. Points:
              numerical gauge maxima (○ offshore, ● Green&apos;s law to 1 m). Dashed: PTWC-style threat thresholds (0.3, 1, 3 m). Empirical relations decay
              as Δ⁻¹, faster than ideal cylindrical spreading (Δ⁻¹ᐟ²).
            </>
          }
        >
          <Chart {...decay} />
        </ChartFrame>

        <ChartFrame
          title="2 · Travel time vs distance"
          name="travel-time"
          caption={
            <>
              Lines: t = Δ/√(gh) for h = 3,000, 4,000 and 5,000 m. Points: numerical first arrivals, which include refraction over real bathymetry. For the
              2004 scenario the observed ≈ 2 h first arrival in Sri Lanka (Goff et al., 2006) is marked.
            </>
          }
        >
          <Chart {...travel} />
        </ChartFrame>

        <ChartFrame
          title="3 · Frequency dispersion"
          name="dispersion"
          csv={() => {
            let s = "kh,c_over_c0,cg_over_c0\n";
            for (let x = 0.01; x <= 3; x += 0.01) s += `${x.toFixed(2)},${cpNorm(x).toFixed(5)},${cgNorm(x).toFixed(5)}\n`;
            return s;
          }}
          caption={
            <>
              ω² = gk tanh(kh). Speeds normalised by √(gh). Markers: characteristic kh of the current source (λ ≈ 2√(LW), h = 4 km). The long-wave model
              assumes kh → 0.
            </>
          }
        >
          <Chart {...disp} />
          <KV
            className="mt-3"
            rows={[
              ["Characteristic wavelength λ ≈ 2√(LW)", `${src.lam0.toFixed(0)} km`],
              ["kh at h = 4 km", src.kh.toFixed(3)],
              ["λ/h", `${dn.lamOverH.toFixed(1)} ${dn.lamOverH < 20 ? "(< 20: dispersive)" : "(≥ 20: long wave)"}`],
              ["Long-wave travel time to Sri Lanka", fmtDur(dn.tL)],
              ["Group-velocity travel time (dispersive)", fmtDur(dn.tG)],
              ["Delay of main energy", fmtDur(dn.tG - dn.tL)],
            ]}
          />
        </ChartFrame>

        <ChartFrame
          title="4 · Sensitivity: magnitude and mechanism"
          name="sensitivity"
          caption={<>Abe (1989) run-up height at the nearest Sri Lankan coast (Δ ≈ {Math.round(dSL).toLocaleString()} km) versus M<sub>w</sub> for each mechanism.</>}
        >
          <Chart {...sens} />
        </ChartFrame>

        <ChartFrame
          title="5 · Uncertainty: Monte Carlo (empirical model)"
          name="monte-carlo"
          csv={mc ? () => "amplitude_m,eta_min\n" + Array.from(mc.amps, (a, i) => `${a.toExponential(5)},${mc.etas[i].toFixed(2)}`).join("\n") : undefined}
          actions={
            <button className="btn btn !min-h-0-primary !py-1 !px-2.5 !text-xs" onClick={runMC}>
              <Play size={13} fill="currentColor" /> Run {cfg.n.toLocaleString()} samples
            </button>
          }
          caption={
            <>
              Abe (1981) propagated with sampled M<sub>w</sub> ~ N({cfg.Mmean}, {cfg.Msd}), mechanism probabilities normal {Math.round(cfg.pNormal * 100)} % /
              strike-slip {Math.round(cfg.pStrike * 100)} % / thrust {Math.round(cfg.pThrust * 100)} %, empirical scatter σ(log₁₀) = {cfg.sigmaLog} and path-mean
              depth ~ N({cfg.hMean} m, {cfg.hSd} m). Seeded (seed {cfg.seed}) so results are exactly reproducible.
            </>
          }
        >
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            {(
              [
                ["Samples", "n", 1000, 50000, 1000],
                ["Seed", "seed", 1, 99999999, 1],
                ["Mw mean", "Mmean", 6, 9.3, 0.1],
                ["Mw σ", "Msd", 0, 0.5, 0.05],
                ["P(normal)", "pNormal", 0, 1, 0.05],
                ["P(strike-slip)", "pStrike", 0, 1, 0.05],
                ["P(thrust)", "pThrust", 0, 1, 0.05],
                ["σ log₁₀ scatter", "sigmaLog", 0, 1, 0.05],
              ] as [string, keyof MCConfig, number, number, number][]
            ).map(([label, k, min, max, step]) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="note">{label}</span>
                <input
                  className="field"
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={cfg[k] as number}
                  onChange={(e) => setCfg({ ...cfg, [k]: Math.max(min, Math.min(max, +e.target.value)) })}
                />
              </label>
            ))}
          </div>
          {mc ? (
            <>
              <Chart {...mcSpec(mc)} />
              <KV
                className="mt-3"
                rows={[
                  ["Amplitude P5 / P50 / P95", `${fmtLen(mc.p.a5)} / ${fmtLen(mc.p.a50)} / ${fmtLen(mc.p.a95)}`],
                  ["P99.9", fmtLen(mc.p.a999)],
                  ["P(H ≥ 0.3 m)", `${(mc.p.pExceed * 100).toFixed(2)} %`],
                  ["P(H ≥ 1 m)", `${(mc.p.pExceed1 * 100).toFixed(2)} %`],
                  ["ETA P5 / P50 / P95", `${fmtDur(mc.p.e5)} / ${fmtDur(mc.p.e50)} / ${fmtDur(mc.p.e95)}`],
                ]}
              />
            </>
          ) : (
            <div className="grid h-48 place-items-center rounded-lg border border-dashed border-line text-muted">Press “Run samples” to compute the distribution.</div>
          )}
        </ChartFrame>
      </div>
    </div>
  );
}
