"use client";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCENARIOS, type Mechanism, type ScenarioId } from "@/lib/physics/source";
import { TOWNS } from "@/lib/physics/stations";
import { useSim, type Layer } from "@/lib/sim/store";
import { CHAPTERS, chapterBySlug, type View } from "@/content/chapters";
import MapView, { mapApi } from "./MapView";
import { Colorbar, LayerBar, Playbar } from "./MapChrome";
import { GaugesPanel, ModelPanel, ResultsPanel, RunsPanel } from "./panels";

const TABS = [
  { k: "model", label: "Model" },
  { k: "results", label: "Results" },
  { k: "gauges", label: "Tide gauges" },
  { k: "runs", label: "Runs" },
  { k: "course", label: "Course" },
] as const;
type Tab = (typeof TABS)[number]["k"];

function applyView(v: View) {
  switch (v) {
    case "domain":
      return mapApi.fitDomain();
    case "sl":
      return mapApi.fitSL();
    case "source":
      return mapApi.fly(-17.8, 65.8, 4.4);
    case "basin":
      return mapApi.fit(-22, 55, 12, 85);
    case "east":
      return mapApi.fly(7.6, 81.7, 8.5);
    case "coast":
      return mapApi.fly(7.6, 80.7, 6.2);
    case "v2004":
      return mapApi.fit(-2, 72, 18, 98);
  }
}

const BADGE: Record<string, string> = {
  safe: "border-[color-mix(in_srgb,var(--ok)_50%,transparent)] bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-ok",
  hypo: "border-[color-mix(in_srgb,var(--bad)_50%,transparent)] bg-[color-mix(in_srgb,var(--bad)_14%,transparent)] text-bad",
  val: "border-[color-mix(in_srgb,var(--accent-2)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] text-accent-2",
};

export default function Simulator() {
  const params = useSim((s) => s.params);
  const running = useSim((s) => s.running);
  const progress = useSim((s) => s.progress);
  const error = useSim((s) => s.error);
  const sp = useSearchParams();
  const urlTab = (sp.get("tab") ?? chapterBySlug(sp.get("ch") ?? "")?.sim?.tab ?? null) as Tab | null;
  const [tab, setTab] = useState<Tab>(() => (urlTab && TABS.some((t) => t.k === urlTab) ? urlTab : "model"));
  // Follow later in-app navigations that change ?tab= (adjusting state during render).
  const [prevUrlTab, setPrevUrlTab] = useState(urlTab);
  if (urlTab !== prevUrlTab) {
    setPrevUrlTab(urlTab);
    if (urlTab && TABS.some((t) => t.k === urlTab)) setTab(urlTab);
  }
  const [panel, setPanel] = useState(true);
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const lastQuery = useRef<string | null>(null);

  /** Scenario, layer, view and playback for a chapter (tab selection is handled by callers). */
  const applyChapter = useCallback((slug: string) => {
    const c = chapterBySlug(slug);
    if (!c?.sim) return;
    const st = useSim.getState();
    if (c.sim.scen && c.sim.scen !== st.params.scen) st.setScenario(c.sim.scen);
    if (c.sim.layer) st.set("layer", c.sim.layer);
    if (c.sim.view) setTimeout(() => applyView(c.sim!.view!), 300);
    if (c.sim.play) {
      const go = () => {
        const s = useSim.getState();
        if (s.run && !s.running) {
          s.seek(0);
          s.setPlaying(true);
        } else setTimeout(go, 300);
      };
      go();
    }
  }, []);

  // ---- boot from URL (permalinks)
  useEffect(() => {
    const qs = sp.toString();
    if (lastQuery.current === qs) return;
    const firstBoot = lastQuery.current === null;
    lastQuery.current = qs;
    const st = useSim.getState();
    const scen = sp.get("scen") as ScenarioId | null;
    const ch = sp.get("ch");
    if (scen && SCENARIOS[scen]) {
      const p: Record<string, unknown> = {};
      const num = (k: string) => (sp.get(k) != null && Number.isFinite(+sp.get(k)!) ? +sp.get(k)! : undefined);
      if (scen === "whatif") {
        if (num("lat") != null) p.lat = num("lat");
        if (num("lon") != null) p.lon = num("lon");
      }
      if (scen !== "v2004" && num("M") != null && !SCENARIOS[scen].locked) p.M = num("M");
      const mech = sp.get("mech") as Mechanism | null;
      if (mech && ["normal", "strike", "thrust"].includes(mech) && scen !== "v2004") p.mech = mech;
      if (num("strike") != null) p.strike = num("strike");
      if (num("res") === 5) p.res = 5;
      if (Object.keys(p).length) {
        st.setScenario(scen, { run: false });
        st.setParams(p);
        void st.runModel();
      } else st.setScenario(scen); // re-uses an existing matching run
    } else if (firstBoot && !st.run && !st.running) void st.runModel();
    const layer = sp.get("layer") as Layer | null;
    if (layer && ["eta", "max", "tt", "bathy", "off"].includes(layer)) st.set("layer", layer);
    if (ch) applyChapter(ch); // the chapter's tab is derived from the URL during render
    const view = sp.get("view") as View | null;
    if (view) setTimeout(() => applyView(view), 1200);
  }, [sp, applyChapter]);

  // ---- live coastal elevations (Copernicus GLO-90 via Open-Meteo)
  useEffect(() => {
    if (Object.keys(useSim.getState().elev).length) return;
    const lat = TOWNS.map((t) => t.lat).join(","),
      lon = TOWNS.map((t) => t.lon).join(",");
    fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { elevation?: number[] }) => {
        if (!j.elevation || j.elevation.length !== TOWNS.length) return;
        const e: Record<string, number> = {};
        j.elevation.forEach((v, i) => {
          if (typeof v === "number" && Number.isFinite(v)) e[TOWNS[i].name] = Math.max(0, v);
        });
        useSim.getState().set("elev", e);
      })
      .catch(() => {});
  }, []);

  // ---- keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,select,textarea,[contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useSim.getState();
      if (e.key === "Escape") setHelp(false);
      else if (e.key === " ") {
        s.setPlaying(!s.playing);
        e.preventDefault();
      } else if (e.key === "r" || e.key === "R") {
        s.setPlaying(false);
        s.seek(0);
      } else if (e.key === "p" || e.key === "P") setPanel((v) => !v);
      else if (e.key === "?") setHelp((v) => !v);
      else if ("12345".includes(e.key) && e.key.length === 1) s.set("layer", (["eta", "max", "tt", "bathy", "off"] as Layer[])[+e.key - 1]);
      else if (e.key === "ArrowRight" && s.run) s.seek(s.t + 5);
      else if (e.key === "ArrowLeft" && s.run) s.seek(s.t - 5);
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => mapApi.map?.resize(), 260);
    return () => clearTimeout(id);
  }, [panel]);

  const share = () => {
    const s = useSim.getState();
    const q = new URLSearchParams({ scen: s.params.scen, layer: s.layer });
    if (s.params.scen !== "v2004") {
      q.set("M", String(s.params.M));
      q.set("mech", s.params.mech);
      q.set("strike", String(s.params.strike));
    }
    if (s.params.scen === "whatif") {
      q.set("lat", String(s.params.lat));
      q.set("lon", String(s.params.lon));
    }
    if (s.params.res === 5) q.set("res", "5");
    const url = `${location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/simulator/?${q}`;
    lastQuery.current = q.toString();
    router.replace(`/simulator?${q}`, { scroll: false });
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  };

  const sc = SCENARIOS[params.scen];

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-[620px] flex-col max-lg:h-auto">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-elev px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[10px] border border-line bg-panel-2" role="tablist" aria-label="Scenario">
            {Object.values(SCENARIOS).map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={params.scen === s.id}
                onClick={() => params.scen !== s.id && useSim.getState().setScenario(s.id)}
                className={`px-3 py-1.5 text-[0.82rem] font-bold ${i ? "border-l border-line" : ""} ${params.scen === s.id ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"}`}
              >
                {s.short}
              </button>
            ))}
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] font-extrabold uppercase tracking-wide ${BADGE[sc.badge]}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {sc.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn" onClick={share} title="Copy a permalink that reproduces this scenario">
            {copied ? "✓ Link copied" : "🔗 Share"}
          </button>
          <button className="btn !px-2.5 max-lg:hidden" onClick={() => setPanel((v) => !v)} title="Show/hide side panel (P)" aria-pressed={panel}>
            ◨
          </button>
          <button className="btn !px-2.5" onClick={() => setHelp(true)} title="Keyboard shortcuts (?)">
            ⌨
          </button>
        </div>
      </div>

      <div className={`grid min-h-0 flex-1 ${panel ? "lg:grid-cols-[minmax(0,1fr)_480px]" : "lg:grid-cols-[minmax(0,1fr)]"} max-lg:grid-cols-1`}>
        <div className="relative min-h-[480px] min-w-0 border-line max-lg:h-[70vh] lg:border-r">
          <MapView />
          <LayerBar />
          <Colorbar />
          <Playbar />
          {running && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(5,10,20,.45)] backdrop-blur-[2px]" role="status" aria-live="polite">
              <div className="card w-[min(440px,90%)] p-4">
                <div className="font-bold text-fg">Running numerical model: {sc.label}</div>
                <div className="my-2.5 h-2 overflow-hidden rounded-full bg-panel-2">
                  <i
                    className="block h-full bg-gradient-to-r from-accent to-accent-2 transition-[width]"
                    style={{ width: `${progress ? (progress.phase === "bathy" ? progress.f * 30 : 30 + progress.f * 70) : 0}%` }}
                  />
                </div>
                <div className="note">{progress?.text ?? "Preparing…"}</div>
                <div className="note mt-1">Computed in a background thread; the page stays responsive.</div>
              </div>
            </div>
          )}
          {error && <div className="callout callout-bad absolute left-3 right-3 top-16 z-20">Model error: {error}</div>}
        </div>

        {panel && (
          <aside className="flex min-h-0 min-w-0 flex-col bg-panel" aria-label="Simulator panel">
            <nav className="flex flex-none gap-0.5 overflow-x-auto border-b border-line p-1.5" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.k}
                  role="tab"
                  aria-selected={tab === t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[0.82rem] font-bold ${tab === t.k ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-auto">
              {tab === "model" && <ModelPanel />}
              {tab === "results" && <ResultsPanel />}
              {tab === "gauges" && <GaugesPanel />}
              {tab === "runs" && <RunsPanel />}
              {tab === "course" && (
                <div className="p-4">
                  <p className="note mb-3">Each chapter sets up the scenario, layer and view for you. Read the full text in the course.</p>
                  <ol className="space-y-1.5">
                    {CHAPTERS.map((c) => (
                      <li key={c.slug} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-panel-2 px-3 py-2">
                        <div className="min-w-0">
                          <div className="eyebrow !text-[0.66rem] text-accent">{c.k}</div>
                          <div className="truncate text-sm font-semibold text-fg">{c.title}</div>
                        </div>
                        <div className="flex flex-none gap-1">
                          {c.sim && (
                            <button className="btn !px-2 !py-1 !text-xs" onClick={() => {
                                applyChapter(c.slug);
                                if (c.sim?.tab) setTab(c.sim.tab as Tab);
                              }}>
                              Show
                            </button>
                          )}
                          <Link className="btn !px-2 !py-1 !text-xs" href={`/learn/${c.slug}`}>
                            Read
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {help && (
        <div className="fixed inset-0 z-[3000] grid place-items-center bg-[rgba(3,8,18,.6)] p-4" onClick={() => setHelp(false)} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-bold">Keyboard shortcuts</h3>
            <div className="kv">
              {[
                ["Space", "Play / pause"],
                ["R", "Rewind to t = 0"],
                ["← / →", "Step 5 min back / forward"],
                ["1–5", "Layer: η, ηmax, travel time, bathymetry, off"],
                ["P", "Show / hide side panel"],
                ["T / G", "3D terrain / globe view"],
                ["B", "Basemap picker"],
                ["?", "This help"],
              ].map(([k, v]) => (
                <Fragment key={k}>
                  <div>
                    <span className="kbd">{k}</span>
                  </div>
                  <div className="!font-normal">{v}</div>
                </Fragment>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button className="btn btn-primary" onClick={() => setHelp(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
