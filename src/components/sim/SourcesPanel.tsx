"use client";
import { Crosshair, LocateFixed, Play, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtLat, fmtLon } from "@/lib/physics/geo";
import {
  compareZones,
  isOverLand,
  SETTING_COLOR,
  SETTINGS,
  SOURCE_BOUNDS,
  SOURCE_ZONES,
  zoneAt,
  type MagMode,
  type SourceZone,
} from "@/lib/physics/sources";
import { fmtDur, fmtLen } from "@/lib/format";
import { useSim } from "@/lib/sim/store";
import { Section } from "@/components/ui/KV";
import { useT } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { mapApi } from "./MapView";

const LEVEL_COLOR: Record<string, string> = { none: "#2ec27e", marine: "#f6c343", land: "#f08a24", major: "#e5484d" };

/** The catalogue zone the current parameters correspond to, if any. */
export function useActiveZone(): SourceZone | undefined {
  const p = useSim((s) => s.params);
  if (p.scen === "actual") return SOURCE_ZONES.find((z) => z.scenario === "actual");
  if (p.scen === "v2004") return SOURCE_ZONES.find((z) => z.scenario === "v2004");
  const z = zoneAt(p.lat, p.lon);
  return z && !z.scenario ? z : undefined;
}

/** Catalogue picker grouped by tectonic setting. */
export function ZoneSelect({ className = "" }: { className?: string }) {
  const t = useT();
  const S = t.sim.sources;
  const active = useActiveZone();
  return (
    <select
      className={`field w-full ${className}`}
      value={active?.id ?? ""}
      aria-label={S.catalogue}
      onChange={(e) => {
        const z = SOURCE_ZONES.find((x) => x.id === e.target.value);
        if (!z) return;
        useSim.getState().loadZone(z.id);
        mapApi.fly(z.lat, z.lon, 4);
      }}
    >
      <option value="">{active ? S.choose : `${S.custom1} · ${S.choose}`}</option>
      {SETTINGS.map((g) => (
        <optgroup key={g} label={S.settings[g]}>
          {SOURCE_ZONES.filter((z) => z.setting === g).map((z) => (
            <option key={z.id} value={z.id}>
              {S.names[z.id as keyof typeof S.names]} · M{z.M.toFixed(1)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/** Pick-on-map button plus land / domain warnings for a custom epicentre. */
export function CustomSourceControls() {
  const t = useT();
  const S = t.sim.sources;
  const picking = useSim((s) => s.picking);
  const clamped = useSim((s) => s.clamped);
  const lat = useSim((s) => s.params.lat);
  const lon = useSim((s) => s.params.lon);
  const onLand = isOverLand(lat, lon);
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          className={`btn ${picking ? "btn-on" : ""}`}
          aria-pressed={picking}
          onClick={() => {
            const st = useSim.getState();
            st.set("picking", !picking);
            if (!picking && (mapApi.map?.getZoom() ?? 0) > 5) mapApi.fitDomain();
          }}
        >
          <Crosshair size={15} /> {S.pick}
        </button>
        {picking && (
          <button className="btn" onClick={() => useSim.getState().set("picking", false)}>
            <X size={15} /> {S.cancel}
          </button>
        )}
      </div>
      {picking && <p className="callout callout-info mt-2 !py-2 text-sm">{S.picking}</p>}
      {onLand && (
        <p className="callout callout-warn mt-2 flex gap-2 !py-2 text-sm">
          <TriangleAlert size={16} className="mt-0.5 flex-none" aria-hidden /> {S.onLand}
        </p>
      )}
      {clamped && (
        <p className="note mt-2">
          {fmt(S.clamped, {
            lat0: SOURCE_BOUNDS.lat0,
            lat1: SOURCE_BOUNDS.lat1,
            lon0: SOURCE_BOUNDS.lon0,
            lon1: SOURCE_BOUNDS.lon1,
          })}
        </p>
      )}
    </>
  );
}

function CurrentSource() {
  const t = useT();
  const S = t.sim.sources;
  const p = useSim((s) => s.params);
  const zone = useActiveZone();
  const name = zone ? S.names[zone.id as keyof typeof S.names] : S.custom1;
  return (
    <div className="rounded-xl border border-line bg-panel-2 p-3">
      <div className="text-[0.72rem] text-muted">{S.current}</div>
      <div className="mt-0.5 flex items-center gap-2 font-bold text-fg">
        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: zone ? SETTING_COLOR[zone.setting] : "var(--accent)" }} aria-hidden />
        {name}
      </div>
      <div className="mt-0.5 text-[0.78rem] text-fg-2 tabular-nums">
        {fmtLat(p.lat)}, {fmtLon(p.lon)} · M{p.M.toFixed(1)} · {t.sim.mech[p.mech]} · {p.strike}°
      </div>
    </div>
  );
}

export function SourcesPanel() {
  const t = useT();
  const S = t.sim.sources;
  const place = (n: string) => t.places[n] ?? n;
  const [mode, setMode] = useState<MagMode>("typical");
  const [fixedM, setFixedM] = useState(8.0);
  const rows = useMemo(() => compareZones(mode, fixedM), [mode, fixedM]);
  const showZones = useSim((s) => s.showZones);
  const running = useSim((s) => s.running);
  const active = useActiveZone();
  const scen = useSim((s) => s.params.scen);
  const M = useSim((s) => s.params.M);

  const lo = -3,
    hi = 1; // 1 mm … 10 m
  const pos = (h: number) => Math.max(0, Math.min(1, (Math.log10(Math.max(h, 1e-6)) - lo) / (hi - lo))) * 100;

  return (
    <>
      <Section title={S.title}>
        <p className="note">{S.lead}</p>
      </Section>

      <Section title={S.custom}>
        <CurrentSource />
        <p className="note mb-2.5 mt-2.5">{S.customLead}</p>
        <CustomSourceControls />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={showZones} onChange={(e) => useSim.getState().set("showZones", e.target.checked)} />
          {S.show}
        </label>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-muted">
          {SETTINGS.map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5">
              <span className="zone-ic !static" style={{ background: SETTING_COLOR[g] }} aria-hidden />
              {S.settings[g]}
            </span>
          ))}
        </div>
      </Section>

      <Section title={S.ranked}>
        <div className="text-[0.8rem] font-semibold text-fg-2">{S.magnitude}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={S.magnitude}>
          {(["typical", "max", "fixed"] as const).map((k) => (
            <button key={k} role="radio" aria-checked={mode === k} className={`btn !min-h-0 !py-1 text-[0.8rem] ${mode === k ? "btn-on" : ""}`} onClick={() => setMode(k)}>
              {S.modes[k]}
            </button>
          ))}
        </div>
        {mode === "fixed" && (
          <div className="mt-2 flex items-center gap-2">
            <input type="range" min={6.5} max={9.2} step={0.1} value={fixedM} onChange={(e) => setFixedM(+e.target.value)} aria-label={S.magnitude} />
            <b className="w-12 tabular-nums">M{fixedM.toFixed(1)}</b>
          </div>
        )}
        <p className="note mt-2">{fmt(S.modeNotes[mode], { m: fixedM.toFixed(1) })}</p>

        <ol className="mt-3 space-y-2">
          {rows.map((r, i) => {
            const z = r.zone;
            const name = S.names[z.id as keyof typeof S.names];
            const isActive = active?.id === z.id && (z.scenario ? scen === z.scenario : scen === "whatif" && Math.abs(M - r.M) < 0.05);
            return (
              <li key={z.id} className={`rounded-xl border p-2.5 ${isActive ? "border-accent bg-accent-soft" : "border-line"}`}>
                <div className="flex items-start justify-between gap-2">
                  <button className="min-w-0 text-left" onClick={() => mapApi.fly(z.lat, z.lon, 4.2)} title={`${fmtLat(z.lat)}, ${fmtLon(z.lon)}`}>
                    <span className="flex items-center gap-1.5 font-bold text-fg">
                      <span className="w-5 flex-none text-right text-[0.72rem] font-semibold text-muted tabular-nums">{i + 1}</span>
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: SETTING_COLOR[z.setting] }} aria-hidden />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="ml-[1.625rem] block text-[0.72rem] text-muted">
                      {S.settings[z.setting]} · M{r.M.toFixed(1)} {t.sim.mech[z.mech]} · {fmt(S.km, { d: Math.round(r.dist).toLocaleString("en-US") })}
                    </span>
                  </button>
                  <button
                    className="btn !min-h-0 flex-none !px-2 !py-1 text-[0.75rem]"
                    title={S.loadTitle}
                    disabled={running}
                    onClick={() => {
                      useSim.getState().loadZone(z.id, z.scenario && r.M === z.M ? undefined : r.M);
                      mapApi.fly(z.lat, z.lon, 3.6);
                    }}
                  >
                    {isActive ? <LocateFixed size={13} /> : <Play size={13} />} {isActive ? S.loaded : S.load}
                  </button>
                </div>
                <div className="ml-[1.625rem] mt-2 grid grid-cols-[minmax(0,1fr)_4.4rem] items-center gap-2 text-[0.75rem]">
                  <span className="relative h-3 rounded-full bg-panel-2" aria-hidden>
                    {[0.3, 1, 3].map((v) => (
                      <span key={v} className="absolute top-[-2px] h-4 w-px bg-[var(--chart-axis)]" style={{ left: `${pos(v)}%` }} />
                    ))}
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos(r.H)}%`, background: LEVEL_COLOR[r.lv.k] }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums text-fg">{fmtLen(r.H)}</span>
                </div>
                <div className="ml-[1.625rem] mt-1 text-[0.72rem] text-fg-2">
                  {S.th.runup}: <b>{t.levels[r.lv.k][0]}</b> ·{" "}
                  {fmt(S.at, { s: place(r.Hat) })} · {S.th.arrival}: {fmtDur(r.eta)} ({place(r.etaAt)})
                </div>
                <div className="ml-[1.625rem] mt-0.5 text-[0.7rem] text-muted">
                  {z.events.length
                    ? z.events.map((e) => `${e.year} Mw ${e.M}${e.tsunami ? ` (${S.tsunami})` : ""}`).join(" · ")
                    : S.none}
                  {" · "}
                  <span title={S.refs}>{z.refs.join("; ")}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_4.4rem] gap-2 pl-[2.25rem] text-[0.66rem] text-muted">
          <span className="relative h-4">
            {[
              [1e-3, "1 mm"],
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
        <p className="note mt-3">{S.note}</p>
        <p className="note mt-2">{S.excluded}</p>
      </Section>

      <Section title={S.settingsTitle}>
        <dl className="space-y-2 text-[0.78rem]">
          {SETTINGS.map((g) => (
            <div key={g}>
              <dt className="flex items-center gap-1.5 font-semibold text-fg">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SETTING_COLOR[g] }} aria-hidden /> {S.settings[g]}
              </dt>
              <dd className="ml-4 text-fg-2">{S.settingNotes[g]}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
