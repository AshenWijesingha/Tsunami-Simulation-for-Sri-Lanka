"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EPI } from "@/lib/physics/constants";
import { buildSource, DEFAULT_PARAMS, MECH, type Mechanism } from "@/lib/physics/source";
import { analyticTown, GROUPS, level, TOWNS, type CoastGroup } from "@/lib/physics/stations";
import { fmtDur, fmtLen } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";
import { KV } from "@/components/ui/KV";

const KEY = "tsunamiLab.ex.v2";
type Progress = { score: number; done: Record<string, boolean>; chBest: number };
const EMPTY: Progress = { score: 0, done: {}, chBest: 0 };

const listeners = new Set<() => void>();
function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function useProgress() {
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readRaw,
    () => "",
  );
  const p: Progress = useMemo(() => {
    try {
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch {
      return EMPTY;
    }
  }, [raw]);
  const save = (n: Progress) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {}
    listeners.forEach((l) => l());
  };
  return {
    p,
    add: (pts: number, id?: string, best?: number) => {
      const cur: Progress = (() => {
        try {
          const r = readRaw();
          return r ? { ...EMPTY, ...JSON.parse(r) } : EMPTY;
        } catch {
          return EMPTY;
        }
      })();
      save({ score: cur.score + pts, done: id ? { ...cur.done, [id]: true } : cur.done, chBest: Math.max(cur.chBest, best ?? 0) });
    },
    reset: () => save(EMPTY),
  };
}

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const QUIZ = [
  { q: "Linear long-wave speed at h = 4,000 m is closest to:", a: ["198 m/s (≈ 713 km/h)", "63 m/s", "500 m/s", "1,500 m/s"], why: "c = √(gh) = √(9.81 × 4000) ≈ 198 m/s." },
  { q: "Green's-law amplification from 4,000 m to 10 m depth is:", a: ["≈ 4.5", "≈ 20", "≈ 400", "≈ 2"], why: "(4000/10)^(1/4) = 400^0.25 ≈ 4.47." },
  { q: "Why is the long-wave model less accurate for this M6.5 ridge source than for a 2004-type megathrust?", a: ["Its short wavelength (λ/h ≈ 8–9) makes frequency dispersion significant", "It cannot represent normal faults", "Coriolis effects dominate for small sources", "The CFL condition fails for small sources"], why: "kh ≈ 0.7 gives c_g/c₀ ≈ 0.8, so dispersion delays and lowers the main wave." },
  { q: "For an explicit scheme, halving Δx (5′ instead of 10′) requires:", a: ["Roughly halving Δt, so about 8× the work in 2-D", "Keeping Δt unchanged", "Doubling Δt", "Quartering Δt only near the coast"], why: "CFL: Δt ∝ Δx. Cells ×4 and steps ×2 gives ≈ 8× the cost." },
  { q: "Which mechanism generates tsunamis most efficiently for a given Mw?", a: ["Shallow thrust (dip-slip) faulting", "Strike-slip on a vertical fault", "Deep-focus (> 300 km) events", "Normal faulting at 300 km depth"], why: "Vertical seafloor displacement drives tsunami generation; shallow dip-slip maximises it." },
  { q: "In Abe's relation log H = Mt − log Δ − 5.80, doubling distance changes H by:", a: ["A factor of ½", "A factor of 1/√2", "A factor of ¼", "No change"], why: "H ∝ Δ⁻¹, faster than the Δ^−1/2 of ideal cylindrical spreading." },
  { q: "Why does the Kajiura factor 1/cosh(kh) reduce the initial sea-surface amplitude?", a: ["The water column filters seafloor deformation at scales shorter than about 3h", "Water compressibility absorbs the energy", "Bottom friction during rupture", "Coriolis deflection"], why: "Deformation at scales comparable to depth is smoothed at the surface (Kajiura, 1963)." },
  { q: "Sri Lanka's east coast receives a weaker wave from this source mainly because:", a: ["It lies in the island's shadow; energy arrives by diffraction and refraction", "The east-coast shelf is deeper", "Tides are larger there", "The Maldives reflect the whole wave"], why: "Coasts facing away from the source receive only diffracted and refracted energy." },
  { q: "In 2004, why were Sri Lanka's south and south-west coasts badly hit despite facing away from Sumatra?", a: ["Waves refracted and diffracted around the island and were trapped along the shelf", "A second earthquake occurred to the south", "The waves crossed the island overland", "Tidal resonance in the Gulf of Mannar"], why: "Field surveys (Liu et al., 2005) documented strong wrap-around and edge-wave effects." },
  { q: "A fragility function P(damage | x) is most commonly modelled as:", a: ["A lognormal cumulative distribution in flow depth", "A linear function of distance from shore", "A step function at 1 m depth", "An exponential decay with elevation"], why: "Lognormal CDFs fitted to survey data are standard (Koshimura et al., 2009; Suppasri et al., 2013)." },
];

function Quiz({ onDone }: { onDone: (score: number, n: number) => void }) {
  const qs = useMemo(() => QUIZ.map((q) => ({ ...q, ord: shuffle(q.a.map((t, ix) => ({ t, ix }))) })), []);
  const [i, setI] = useState(0);
  const [sc, setSc] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  if (i >= qs.length)
    return (
      <div>
        <p className="text-lg">
          Score: <b>{sc} / {qs.length}</b>
        </p>
      </div>
    );
  const q = qs[i];
  return (
    <div>
      <div className="note">
        Question {i + 1} of {qs.length} · score {sc}
      </div>
      <p className="mt-2 font-semibold text-fg">{q.q}</p>
      <div className="mt-3 grid gap-1.5">
        {q.ord.map((o) => {
          const state = pick == null ? "" : o.ix === 0 ? "!border-ok !bg-[color-mix(in_srgb,var(--ok)_15%,transparent)]" : o.ix === pick ? "!border-bad !bg-[color-mix(in_srgb,var(--bad)_15%,transparent)]" : "";
          return (
            <button
              key={o.ix}
              disabled={pick != null}
              className={`btn !justify-start !whitespace-normal text-left ${state}`}
              onClick={() => {
                setPick(o.ix);
                if (o.ix === 0) setSc(sc + 1);
              }}
            >
              {o.t}
            </button>
          );
        })}
      </div>
      {pick != null && (
        <>
          <p className="note mt-3">
            {pick === 0 ? "✅ " : "❌ "}
            {q.why}
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => {
              const ni = i + 1;
              setI(ni);
              setPick(null);
              if (ni >= qs.length) onDone(sc, qs.length);
            }}
          >
            {i + 1 < qs.length ? "Next →" : "Finish"}
          </button>
        </>
      )}
    </div>
  );
}

const BUCK: [string, number, number][] = [
  ["< 1 cm", 0, 0.01],
  ["1–30 cm", 0.01, 0.3],
  ["0.3–1 m", 0.3, 1],
  ["> 1 m", 1, Infinity],
];

function Predict({ onDone }: { onDone: (pts: number) => void }) {
  const run = useSim((s) => s.run);
  const running = useSim((s) => s.running);
  const [t, setT] = useState(240);
  const [b, setB] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const scored = useRef(false);
  const have = run && run.params.scen === "actual";
  const col = have ? slRows(run).find((r) => r.q.name === "Colombo") : null;

  const lock = () => {
    setLocked(true);
    const st = useSim.getState();
    if (!have) {
      st.setScenario("actual", { run: false });
      void st.runModel();
    }
  };
  const verdict =
    locked && col && b != null
      ? (() => {
          const amp = Math.max(col.a.H81, col.q.green1);
          const bi = BUCK.findIndex((x) => amp >= x[1] && amp < x[2]);
          const err = Math.abs(t - col.q.etaShore);
          const ts = Math.max(0, Math.round(100 - err * 1.5));
          return { amp, bi, err, ts, ok: bi === b };
        })()
      : null;
  useEffect(() => {
    if (verdict && !scored.current) {
      scored.current = true;
      onDone(verdict.ts + (verdict.ok ? 50 : 0));
    }
  }, [verdict, onDone]);
  let result: React.ReactNode = null;
  if (verdict && col) {
    const { amp, bi, err, ts, ok } = verdict;
    result = (
      <KV
        className="mt-4"
        rows={[
          ["Model arrival (numerical, shore)", fmtDur(col.q.etaShore)],
          ["Your prediction", `${fmtDur(t)} (${Math.round(err)} min off)`],
          ["Timing score", `${ts} / 100`],
          ["Model amplitude (max of Abe-81, Green 1 m)", fmtLen(amp)],
          ["Amplitude class", ok ? "✅ correct (+50)" : `❌ it was ${BUCK[bi][0]}`],
        ]}
      />
    );
  }
  return (
    <div>
      <p className="note">Scenario A. Colombo is about 3,150 km from the epicentre along the great circle. Predict before you look.</p>
      <label className="mt-3 block text-sm">
        Arrival time at Colombo after origin: <b className="text-gold">{fmtDur(t)}</b>
        <input type="range" min={60} max={420} step={5} value={t} disabled={locked} onChange={(e) => setT(+e.target.value)} />
      </label>
      <div className="mt-2 text-sm">Coastal amplitude class:</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {BUCK.map((x, i) => (
          <button key={i} disabled={locked} className={`btn ${b === i ? "btn-on" : ""}`} onClick={() => setB(i)}>
            {x[0]}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="btn btn-primary mt-4" disabled={b == null} onClick={lock}>
          Lock in & verify
        </button>
      )}
      {locked && !col && <p className="note mt-3">{running ? "Running the numerical model…" : "Waiting for the model…"}</p>}
      {result}
    </div>
  );
}

function Decision({ onDone }: { onDone: (ok: boolean) => void }) {
  const src = useMemo(() => buildSource(DEFAULT_PARAMS), []);
  const srcThrust = useMemo(() => buildSource({ ...DEFAULT_PARAMS, mech: "thrust" }), []);
  const max = Math.max(...TOWNS.map((t) => analyticTown(t, src).H89));
  const maxT = Math.max(...TOWNS.map((t) => analyticTown(t, srcThrust).H89));
  const first = Math.min(...TOWNS.map((t) => analyticTown(t, src).eta));
  const [pick, setPick] = useState<string | null>(null);
  return (
    <div>
      <div className="callout callout-info">
        <b>17:41 SLT, t + 65 min.</b> M6.5, depth 10 km, 17.78° S 65.82° E (Central Indian Ridge). Mechanism unknown. Your empirical estimate: max coastal Ht ≈{" "}
        <b>{fmtLen(max)}</b> (normal), <b>{fmtLen(maxT)}</b> even if thrust. First arrival ≈ {fmtDur(first)}.
      </div>
      <div className="mt-3 grid gap-1.5">
        {[
          ["none", "No Tsunami Threat"],
          ["watch", "Tsunami Watch (stay alert)"],
          ["warn", "Tsunami Warning (evacuate coast)"],
        ].map(([k, l]) => (
          <button
            key={k}
            disabled={pick != null}
            className={`btn !justify-start ${pick && k === "none" ? "!border-ok" : pick === k ? "!border-bad" : ""}`}
            onClick={() => {
              setPick(k);
              onDone(k === "none");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {pick && (
        <p className="note mt-3">
          {pick === "none"
            ? "✅ Matches Bulletin No. 02. Even the thrust upper bound is far below 0.3 m. A false alarm costs livelihoods and public trust."
            : "❌ Over-warning. Even worst-case assumptions give millimetres. The Department of Meteorology issued No Tsunami Threat."}
        </p>
      )}
    </div>
  );
}

function Challenge({ onDone }: { onDone: (total: number) => void }) {
  const make = () => {
    const mechs: Mechanism[] = ["thrust", "thrust", "thrust", "normal", "strike"];
    const M = Math.round((7.0 + Math.random() * 2.3) * 10) / 10,
      mech = mechs[Math.floor(Math.random() * 5)];
    const s = { lat: EPI.lat, lon: EPI.lon, Mt: M + MECH[mech].adj };
    const calc = TOWNS.map((t) => ({ t, a: analyticTown(t, s) }));
    const maxH = Math.max(...calc.map((c) => c.a.H89));
    const need = {} as Record<CoastGroup, boolean>;
    (Object.keys(GROUPS) as CoastGroup[]).forEach((g) => (need[g] = Math.max(0, ...calc.filter((c) => c.t.group === g).map((c) => c.a.H89)) >= 1));
    const lk = level(maxH).k;
    return { M, mech, maxH, lv: lk === "major" ? "land" : lk, need, t0: Date.now() };
  };
  const [ch, setCh] = useState(make);
  const [pick, setPick] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<CoastGroup>>(new Set());
  const [left, setLeft] = useState(45);
  const [res, setRes] = useState<null | { rows: [string, string][]; tot: number }>(null);
  useEffect(() => {
    if (res) return;
    const iv = setInterval(() => setLeft(Math.max(0, 45 - (Date.now() - ch.t0) / 1000)), 250);
    return () => clearInterval(iv);
  }, [ch, res]);
  const submit = () => {
    if (!pick) return;
    const ord = ["none", "marine", "land"],
      dl = Math.abs(ord.indexOf(pick) - ord.indexOf(ch.lv));
    const lp = dl === 0 ? 150 : dl === 1 ? 60 : 0;
    let cp = 0;
    const rows: [string, string][] = [];
    (Object.keys(GROUPS) as CoastGroup[]).forEach((g) => {
      const ok = sel.has(g) === ch.need[g];
      cp += ok ? 30 : 0;
      rows.push([GROUPS[g], (ch.need[g] ? "evacuate" : "stay") + (ok ? " ✓" : " ✗")]);
    });
    const tp = Math.round((50 * Math.max(0, 45 - (Date.now() - ch.t0) / 1000)) / 45);
    const tot = lp + cp + tp;
    setRes({
      tot,
      rows: [
        ["Correct level", `${{ none: "No threat", marine: "Marine", land: "Land" }[ch.lv as "none"]} (max Ht ${fmtLen(ch.maxH)})`],
        ["Level points", `${lp} / 150`],
        ...rows,
        ["Coast points", `${cp} / 150`],
        ["Speed bonus", `${tp} / 50`],
        ["Total", `${tot} / 350`],
      ],
    });
    onDone(tot);
  };
  const next = () => {
    setCh(make());
    setPick(null);
    setSel(new Set());
    setRes(null);
    setLeft(45);
  };
  return (
    <div>
      <div className="callout callout-warn flex flex-wrap items-center justify-between gap-2">
        <span>
          <b>
            M{ch.M.toFixed(1)} {MECH[ch.mech].label}
          </b>{" "}
          at 17.78° S, 65.82° E, depth 10 km (hypothetical).
        </span>
        <b className="tabular-nums">{res ? "—" : `${Math.ceil(left)} s left`}</b>
      </div>
      <p className="mt-3 text-sm font-semibold">1 · Threat level</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {[
          ["none", "No threat (< 0.3 m)"],
          ["marine", "Marine (0.3–1 m)"],
          ["land", "Land (≥ 1 m)"],
        ].map(([k, l]) => (
          <button key={k} disabled={!!res} className={`btn ${pick === k ? "btn-on" : ""}`} onClick={() => setPick(k)}>
            {l}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold">2 · Evacuate coasts (Ht ≥ 1 m)</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(Object.keys(GROUPS) as CoastGroup[]).map((g) => (
          <button
            key={g}
            disabled={!!res}
            className={`btn ${sel.has(g) ? "btn-on" : ""}`}
            onClick={() => {
              const n = new Set(sel);
              if (n.has(g)) n.delete(g);
              else n.add(g);
              setSel(n);
            }}
          >
            {GROUPS[g]}
          </button>
        ))}
      </div>
      {!res ? (
        <button className="btn btn-primary mt-4 w-full" disabled={!pick} onClick={submit}>
          Submit
        </button>
      ) : (
        <>
          <KV className="mt-4" rows={res.rows} />
          <button className="btn btn-primary mt-3" onClick={next}>
            Next round
          </button>
        </>
      )}
    </div>
  );
}

const EXS = [
  { id: "quiz", t: "Concept quiz (graduate level)", d: "10 questions on source physics, numerics, dispersion, shoaling and impact." },
  { id: "pred", t: "Predict & verify", d: "Predict the Colombo arrival time and amplitude class, then check against the numerical model." },
  { id: "call", t: "Operational decision at t + 65 min", d: "Issue the bulletin with only what forecasters knew at 17:41." },
  { id: "challenge", t: "Forecaster challenge", d: "Random hypothetical sources at the bulletin epicentre. Set the threat level and coasts to evacuate in 45 s." },
] as const;

export default function Exercises() {
  const { p, add, reset } = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-3 self-start lg:sticky lg:top-20">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="eyebrow">Your progress</div>
            <button className="btn !px-2 !py-0.5 !text-xs" onClick={reset}>
              Reset
            </button>
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums">{p.score}</div>
          <div className="note">points · challenge best {p.chBest} / 350 · saved on this device only</div>
        </div>
        {EXS.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setOpen(e.id);
              setKey((k) => k + 1);
            }}
            className={`card block w-full p-4 text-left ${open === e.id ? "!border-accent" : ""} ${p.done[e.id] ? "border-[color-mix(in_srgb,var(--ok)_50%,transparent)]" : ""}`}
          >
            <div className="font-bold text-fg">
              {p.done[e.id] ? "✅ " : ""}
              {e.t}
            </div>
            <div className="note mt-1">{e.d}</div>
          </button>
        ))}
      </aside>
      <div className="card min-h-[380px] p-6">
        {!open && <p className="note">Choose an exercise on the left. The course chapters give everything you need; the simulator and analysis pages let you check your reasoning.</p>}
        {open === "quiz" && (
          <>
            <h2 className="mb-3 text-xl font-bold">Concept quiz</h2>
            <Quiz key={key} onDone={(s, n) => add(s * 10, s >= Math.ceil(n * 0.7) ? "quiz" : undefined)} />
          </>
        )}
        {open === "pred" && (
          <>
            <h2 className="mb-3 text-xl font-bold">Predict & verify</h2>
            <Predict key={key} onDone={(pts) => add(pts, "pred")} />
          </>
        )}
        {open === "call" && (
          <>
            <h2 className="mb-3 text-xl font-bold">Operational decision at t + 65 min</h2>
            <Decision key={key} onDone={(ok) => add(ok ? 80 : 0, ok ? "call" : undefined)} />
          </>
        )}
        {open === "challenge" && (
          <>
            <h2 className="mb-3 text-xl font-bold">Forecaster challenge</h2>
            <Challenge key={key} onDone={(tot) => add(Math.round(tot / 5), "challenge", tot)} />
          </>
        )}
      </div>
    </div>
  );
}
