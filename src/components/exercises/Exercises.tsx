"use client";
import { ArrowRight, CircleCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EPI } from "@/lib/physics/constants";
import { buildSource, DEFAULT_PARAMS, MECH, type Mechanism } from "@/lib/physics/source";
import { analyticTown, GROUPS, level, TOWNS, type CoastGroup } from "@/lib/physics/stations";
import { fmtDur, fmtLen } from "@/lib/format";
import { slRows } from "@/lib/sim/derive";
import { useSim } from "@/lib/sim/store";
import { KV } from "@/components/ui/KV";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/config";

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


function Quiz({ onDone }: { onDone: (score: number, n: number) => void }) {
  const tr = useT();
  const Q = tr.exercises.quiz;
  // The correct answer is always index 0 in the dictionary; display order is shuffled once per attempt.
  const order = useMemo(() => Q.items.map((q) => shuffle(q.a.map((_, ix) => ix))), [Q.items]);
  const qs = Q.items.map((q, k) => ({ ...q, ord: order[k].map((ix) => ({ t: q.a[ix], ix })) }));
  const [i, setI] = useState(0);
  const [sc, setSc] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  if (i >= qs.length)
    return (
      <div>
        <p className="text-lg">
          <b>{fmt(Q.score, { s: sc, n: qs.length })}</b>
        </p>
      </div>
    );
  const q = qs[i];
  return (
    <div>
      <div className="note">
        {fmt(Q.progress, { i: i + 1, n: qs.length, s: sc })}
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
            {i + 1 < qs.length ? Q.next : Q.finish} <ArrowRight size={15} />
          </button>
        </>
      )}
    </div>
  );
}

const BUCK: [number, number][] = [
  [0, 0.01],
  [0.01, 0.3],
  [0.3, 1],
  [1, Infinity],
];

function Predict({ onDone }: { onDone: (pts: number) => void }) {
  const run = useSim((s) => s.run);
  const running = useSim((s) => s.running);
  const [t, setT] = useState(240);
  const [b, setB] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const scored = useRef(false);
  const P = useT().exercises.predict;
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
          const bi = BUCK.findIndex((x) => amp >= x[0] && amp < x[1]);
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
          [P.kv.model, fmtDur(col.q.etaShore)],
          [P.kv.yours, fmt(P.kv.off, { t: fmtDur(t), m: Math.round(err) })],
          [P.kv.timing, `${ts} / 100`],
          [P.kv.amp, fmtLen(amp)],
          [P.kv.cls, ok ? `✅ ${P.kv.correct}` : `❌ ${fmt(P.kv.wrong, { b: P.buckets[bi] })}`],
        ]}
      />
    );
  }
  return (
    <div>
      <p className="note">{P.intro}</p>
      <label className="mt-3 block text-sm">
        {P.arrival} <b className="text-gold">{fmtDur(t)}</b>
        <input type="range" min={60} max={420} step={5} value={t} disabled={locked} onChange={(e) => setT(+e.target.value)} />
      </label>
      <div className="mt-2 text-sm">{P.amplitude}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {BUCK.map((_, i) => (
          <button key={i} disabled={locked} className={`btn ${b === i ? "btn-on" : ""}`} onClick={() => setB(i)}>
            {P.buckets[i]}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="btn btn-primary mt-4" disabled={b == null} onClick={lock}>
          {P.lock}
        </button>
      )}
      {locked && !col && <p className="note mt-3">{running ? P.running : P.waiting}</p>}
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
  const D = useT().exercises.decision;
  const [head, ...rest] = fmt(D.brief, { a: "\u0001", b: "\u0002", t: fmtDur(first) }).split(/(?<=SLT, t \+ 65 min\.)/);
  const brief = (rest.length ? rest.join("") : head).split(/(\u0001|\u0002)/).map((part, i) =>
    part === "\u0001" ? <b key={i}>{fmtLen(max)}</b> : part === "\u0002" ? <b key={i}>{fmtLen(maxT)}</b> : part,
  );
  return (
    <div>
      <div className="callout callout-info">
        {rest.length ? <b>{head}</b> : null}
        {brief}
      </div>
      <div className="mt-3 grid gap-1.5">
        {(["none", "watch", "warn"] as const).map((k) => (
          <button
            key={k}
            disabled={pick != null}
            className={`btn !justify-start ${pick && k === "none" ? "!border-ok" : pick === k ? "!border-bad" : ""}`}
            onClick={() => {
              setPick(k);
              onDone(k === "none");
            }}
          >
            {D.options[k]}
          </button>
        ))}
      </div>
      {pick && (
        <p className="note mt-3">
          {pick === "none"
            ? `✅ ${D.right}`
            : `❌ ${D.wrong}`}
        </p>
      )}
    </div>
  );
}

function Challenge({ onDone }: { onDone: (total: number) => void }) {
  const tr = useT();
  const C = tr.exercises.challenge;
  const G = tr.exercises.groups;
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
      rows.push([G[g], (ch.need[g] ? C.kv.evacuate : C.kv.stay) + (ok ? " ✓" : " ✗")]);
    });
    const tp = Math.round((50 * Math.max(0, 45 - (Date.now() - ch.t0) / 1000)) / 45);
    const tot = lp + cp + tp;
    setRes({
      tot,
      rows: [
        [C.kv.correct, fmt(C.kv.correctVal, { l: C.short[ch.lv as "none" | "marine" | "land"], h: fmtLen(ch.maxH) })],
        [C.kv.levelPts, `${lp} / 150`],
        ...rows,
        [C.kv.coastPts, `${cp} / 150`],
        [C.kv.speed, `${tp} / 50`],
        [C.kv.total, `${tot} / 350`],
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
        <span>{fmt(C.source, { m: ch.M.toFixed(1), mech: tr.sim.mech[ch.mech] })}</span>
        <b className="tabular-nums">{res ? "—" : fmt(C.left, { s: Math.ceil(left) })}</b>
      </div>
      <p className="mt-3 text-sm font-semibold">{C.level}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(["none", "marine", "land"] as const).map((k) => (
          <button key={k} disabled={!!res} className={`btn ${pick === k ? "btn-on" : ""}`} onClick={() => setPick(k)}>
            {C.levels[k]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold">{C.coasts}</p>
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
            {G[g]}
          </button>
        ))}
      </div>
      {!res ? (
        <button className="btn btn-primary mt-4 w-full" disabled={!pick} onClick={submit}>
          {C.submit}
        </button>
      ) : (
        <>
          <KV className="mt-4" rows={res.rows} />
          <button className="btn btn-primary mt-3" onClick={next}>
            {C.next}
          </button>
        </>
      )}
    </div>
  );
}

const EXS = ["quiz", "pred", "call", "challenge"] as const;

export default function Exercises() {
  const { p, add, reset } = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const X = useT().exercises;
  const exs = EXS.map((id) => ({ id, t: X.list[id][0], d: X.list[id][1] }));
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-3 self-start lg:sticky lg:top-20">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="eyebrow">{X.progress}</div>
            <button className="btn !min-h-0 !px-2 !py-0.5 !text-xs" onClick={reset}>
              {X.reset}
            </button>
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums">{p.score}</div>
          <div className="note">{fmt(X.points, { b: p.chBest })}</div>
        </div>
        {exs.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setOpen(e.id);
              setKey((k) => k + 1);
            }}
            className={`card block w-full p-4 text-left ${open === e.id ? "!border-accent" : ""} ${p.done[e.id] ? "border-[color-mix(in_srgb,var(--ok)_50%,transparent)]" : ""}`}
          >
            <div className="font-bold text-fg">
              {p.done[e.id] && <CircleCheck size={16} className="mr-1.5 inline -translate-y-px text-ok" aria-label={X.completed} />}
              {e.t}
            </div>
            <div className="note mt-1">{e.d}</div>
          </button>
        ))}
      </aside>
      <div className="card min-h-[380px] p-6">
        {!open && <p className="note">{X.choose}</p>}
        {open === "quiz" && (
          <>
            <h2 className="mb-3 text-xl font-bold">{X.quiz.title}</h2>
            <Quiz key={key} onDone={(s, n) => add(s * 10, s >= Math.ceil(n * 0.7) ? "quiz" : undefined)} />
          </>
        )}
        {open === "pred" && (
          <>
            <h2 className="mb-3 text-xl font-bold">{X.predict.title}</h2>
            <Predict key={key} onDone={(pts) => add(pts, "pred")} />
          </>
        )}
        {open === "call" && (
          <>
            <h2 className="mb-3 text-xl font-bold">{X.decision.title}</h2>
            <Decision key={key} onDone={(ok) => add(ok ? 80 : 0, ok ? "call" : undefined)} />
          </>
        )}
        {open === "challenge" && (
          <>
            <h2 className="mb-3 text-xl font-bold">{X.challenge.title}</h2>
            <Challenge key={key} onDone={(tot) => add(Math.round(tot / 5), "challenge", tot)} />
          </>
        )}
      </div>
    </div>
  );
}
