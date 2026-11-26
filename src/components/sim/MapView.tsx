"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker, StyleSpecification } from "maplibre-gl";
import { DOM, DONDRA, SL_BOUNDS } from "@/lib/physics/constants";
import { deg, fmtLat, fmtLon, greatCircle, rad } from "@/lib/physics/geo";
import { TERRARIUM, decodeTerrarium } from "@/lib/physics/bathymetry";
import { analyticTown, GAUGES } from "@/lib/physics/stations";
import { MECH } from "@/lib/physics/source";
import type { RunData } from "@/lib/physics/simulate";
import { fmtDur, fmtLen } from "@/lib/format";
import { live, useSim } from "@/lib/sim/store";
import { slRows } from "@/lib/sim/derive";
import { renderField } from "@/lib/sim/render";

type BasemapKey = "liberty" | "positron" | "dark" | "satellite" | "osm";

const EOX_ATTR =
  '<a href="https://s2maps.eu" target="_blank" rel="noopener">Sentinel-2 cloudless – s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 &amp; 2017), CC BY 4.0';
const rasterStyle = (id: string, tiles: string[], attr: string, maxz: number, bg: string): StyleSpecification => ({
  version: 8,
  sources: { [id]: { type: "raster", tiles, tileSize: 256, maxzoom: maxz, attribution: attr } },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": bg } },
    { id, type: "raster", source: id },
  ],
});
const BASEMAPS: Record<BasemapKey, { label: string; desc: string; sw: string; style: () => string | StyleSpecification }> = {
  positron: { label: "Light", desc: "OpenFreeMap Positron (vector)", sw: "linear-gradient(135deg,#fafafa,#e5e5e5 60%,#d3dde6)", style: () => "https://tiles.openfreemap.org/styles/positron" },
  dark: { label: "Dark", desc: "OpenFreeMap Dark (vector)", sw: "linear-gradient(135deg,#2b2b2b,#141414 60%,#1d2530)", style: () => "https://tiles.openfreemap.org/styles/dark" },
  liberty: { label: "Streets", desc: "OpenFreeMap Liberty (vector)", sw: "linear-gradient(135deg,#f3efe6,#cde3c4 55%,#9cc7ec)", style: () => "https://tiles.openfreemap.org/styles/liberty" },
  satellite: {
    label: "Satellite",
    desc: "Sentinel-2 cloudless 2016 (EOX, CC BY 4.0)",
    sw: "linear-gradient(135deg,#2f5130,#7a6a45 50%,#1d3b5c)",
    style: () => rasterStyle("s2", ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"], EOX_ATTR, 14, "#0b1a2b"),
  },
  osm: {
    label: "OpenStreetMap",
    desc: "OSM Standard (raster)",
    sw: "linear-gradient(135deg,#f2efe9,#aad3df 60%,#cfe8b5)",
    style: () => rasterStyle("osm", ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors', 19, "#aad3df"),
  },
};
const DEM_ATTR = 'Terrain: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank">Tilezen/Mapzen Terrain Tiles</a> (SRTM, ETOPO1 et al.)';

/** Imperative API so panels (lecture chapters, tables) can steer the map. */
export const mapApi = {
  map: null as MLMap | null,
  pad() {
    return typeof window !== "undefined" && innerWidth > 1024 ? { top: 64, bottom: 130, left: 30, right: 60 } : { top: 56, bottom: 170, left: 10, right: 10 };
  },
  fit(s: number, w: number, n: number, e: number, duration = 1100) {
    this.map?.fitBounds([[w, s], [e, n]], { padding: this.pad(), duration });
  },
  fitDomain(duration?: number) {
    this.fit(DOM.lat0, DOM.lon0, DOM.lat1, DOM.lon1, duration);
  },
  fitSL() {
    this.fit(SL_BOUNDS.s, SL_BOUNDS.w, SL_BOUNDS.n, SL_BOUNDS.e);
  },
  fly(lat: number, lon: number, zoom: number) {
    this.map?.flyTo({ center: [lon, lat], zoom, duration: 1300, essential: true });
  },
  openGauge: (name: string) => void name,
};

function maxRunup(run: RunData | null) {
  if (!run) return 0;
  let m = 0;
  for (const r of slRows(run)) m = Math.max(m, r.hz);
  return m;
}

let EMPTY_PNG: ArrayBuffer | null = null;
async function emptyPng() {
  if (EMPTY_PNG) return EMPTY_PNG.slice(0);
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  EMPTY_PNG = await b!.arrayBuffer();
  return EMPTY_PNG.slice(0);
}
function loadImg(src: string, ms: number): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    const to = setTimeout(() => {
      im.src = "";
      rej(new Error("timeout"));
    }, ms);
    im.onload = () => {
      clearTimeout(to);
      res(im);
    };
    im.onerror = () => {
      clearTimeout(to);
      rej(new Error("err"));
    };
    im.src = src;
  });
}

let protocolAdded = false;
async function ensureProtocol(ml: typeof import("maplibre-gl")) {
  if (protocolAdded) return;
  protocolAdded = true;
  ml.addProtocol("coastov", async (params) => {
    try {
      const m = params.url.match(/coastov:\/\/(\w+)\/(\d+)\/(\d+)\/(\d+)\?R=([\d.eE+-]+)/);
      if (!m) return { data: await emptyPng() };
      const mode = m[1],
        z = +m[2],
        x = +m[3],
        y = +m[4],
        R = +m[5];
      if (mode === "inund" && R < 0.01) return { data: await emptyPng() };
      const img = await loadImg(TERRARIUM.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)), 15000);
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const N = 65536,
        e = decodeTerrarium(ctx.getImageData(0, 0, 256, 256).data);
      const out = ctx.createImageData(256, 256),
        o = out.data;
      if (mode === "zones") {
        for (let i = 0; i < N; i++) {
          const v = e[i];
          let cc: number[] | null = null;
          if (v > 0 && v <= 2) cc = [229, 72, 77, 175];
          else if (v > 2 && v <= 5) cc = [240, 138, 36, 145];
          else if (v > 5 && v <= 10) cc = [246, 195, 67, 115];
          if (cc) o.set(cc, i * 4);
        }
      } else {
        // Bathtub: land connected to the sea with z ≤ R, limited inland distance.
        const lat = deg(Math.atan(Math.sinh(Math.PI - (2 * Math.PI * (y + 0.5)) / Math.pow(2, z))));
        const pxm = (156543.03 * Math.cos(rad(lat))) / Math.pow(2, z);
        const maxIn = Math.min(3000, Math.max(50, 250 * R)),
          maxSteps = Math.max(1, Math.round(maxIn / pxm));
        const dist = new Int32Array(N).fill(-1),
          q = new Int32Array(N);
        let qh = 0,
          qt = 0;
        for (let i = 0; i < N; i++)
          if (e[i] <= 0) {
            dist[i] = 0;
            q[qt++] = i;
          }
        while (qh < qt) {
          const i = q[qh++],
            xx = i & 255,
            yy = i >> 8,
            dn = dist[i] + 1;
          if (dn > maxSteps) continue;
          const nb = [xx > 0 ? i - 1 : -1, xx < 255 ? i + 1 : -1, yy > 0 ? i - 256 : -1, yy < 255 ? i + 256 : -1];
          for (const jj of nb) {
            if (jj < 0 || dist[jj] !== -1) continue;
            if (e[jj] > 0 && e[jj] <= R) {
              dist[jj] = dn;
              q[qt++] = jj;
            }
          }
        }
        for (let i = 0; i < N; i++) if (dist[i] > 0) o.set([30, 144, 255, Math.min(220, 90 + ((R - e[i]) / R) * 130)], i * 4);
      }
      ctx.clearRect(0, 0, 256, 256);
      ctx.putImageData(out, 0, 0);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
      return { data: await blob!.arrayBuffer() };
    } catch {
      return { data: await emptyPng() };
    }
  });
}

function popupHtml(name: string, run: RunData | null, elev: Record<string, number>) {
  const st = GAUGES.find((g) => g.name === name)!;
  if (!run) return `<b>${name}</b><br>Run the model to see results.`;
  const q = run.gauges.find((g) => g.name === name)!;
  const a = analyticTown(st, run.src);
  let s = `<b>${name}</b>${st.district ? ` <span style="opacity:.7">· ${st.district} District</span>` : ""}<br>Great-circle distance: ${Math.round(q.dist).toLocaleString()} km<br>`;
  if (q.snap)
    s += `Model gauge cell: depth ${Math.round(q.snap.h)} m, ${q.snap.dkm.toFixed(0)} km offshore<br>Numerical arrival: <b>${fmtDur(q.etaShore)}</b> (offshore ${fmtDur(q.arr)})<br>Max η offshore: <b>${fmtLen(q.max)}</b> · Green's law to 1 m: ${fmtLen(q.green1)}<br>`;
  if (st.sl) {
    const ev = elev[name];
    s += `Empirical Abe (1981) H: ${fmtLen(a.H81)} · Abe (1989) Ht: ${fmtLen(a.H89)}${a.shelter ? " (sheltered ×0.5)" : ""}<br>Analytic ETA: ${fmtDur(a.eta)}<br>Ground elevation: ${(ev ?? st.elev ?? 0).toFixed(1)} m ${ev != null ? "(DEM)" : "(approx.)"}`;
  }
  return s;
}

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const calc = () => {
      const a = document.documentElement.getAttribute("data-theme");
      setDark(a ? a === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
    };
    calc();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", calc);
    window.addEventListener("themechange", calc);
    return () => {
      mq.removeEventListener("change", calc);
      window.removeEventListener("themechange", calc);
    };
  }, []);
  return dark;
}

export default function MapView() {
  const el = useRef<HTMLDivElement>(null);
  const fieldCanvas = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const epiRef = useRef<Marker | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [styleGen, setStyleGen] = useState(0);
  const dark = useTheme();
  const [basemap, setBasemap] = useState<BasemapKey | null>(null);
  const [menu, setMenu] = useState(false);
  const [terrain, setTerrain] = useState(false);
  const [globe, setGlobe] = useState(false);
  const bm: BasemapKey = basemap ?? (dark ? "dark" : "positron");

  const run = useSim((s) => s.run);
  const frame = useSim((s) => s.frame);
  const layer = useSim((s) => s.layer);
  const scaleMul = useSim((s) => s.scaleMul);
  const overlay = useSim((s) => s.overlay);
  const params = useSim((s) => s.params);
  const elev = useSim((s) => s.elev);

  // ---- create map once
  useEffect(() => {
    let disposed = false;
    if (!fieldCanvas.current) {
      fieldCanvas.current = document.createElement("canvas");
      fieldCanvas.current.width = fieldCanvas.current.height = 2;
    }
    (async () => {
      let ml: typeof import("maplibre-gl");
      try {
        ml = await import("maplibre-gl");
      } catch {
        setFailed("The map library couldn't load. The numerical model, charts and tables still work.");
        return;
      }
      if (disposed || !el.current) return;
      await ensureProtocol(ml);
      let map: MLMap;
      try {
        map = new ml.Map({
          container: el.current,
          style: BASEMAPS[bm].style(),
          center: [75, -2],
          zoom: 2.6,
          minZoom: 1.2,
          maxPitch: 75,
          attributionControl: { compact: true },
          fadeDuration: 0,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });
      } catch {
        setFailed("The interactive map needs WebGL, which isn't available here. The numerical model, charts and tables still work.");
        return;
      }
      mapRef.current = map;
      mapApi.map = map;
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new ml.ScaleControl({ unit: "metric" }), "bottom-right");
      let styleOK = false;
      map.on("style.load", () => {
        styleOK = true;
        setStyleGen((g) => g + 1);
      });
      // If the remote vector style is blocked or offline, fall back to inline raster styles so the model field still shows.
      setTimeout(() => {
        if (!styleOK && mapRef.current === map) {
          setFallbackNote("The selected basemap didn't load (offline or blocked); showing OpenStreetMap raster tiles instead.");
          map.setStyle(BASEMAPS.osm.style(), { diff: false });
        }
      }, 8000);
      const ro = new ResizeObserver(() => map.resize());
      ro.observe(el.current);
      roRef.current = ro;
      map.on("error", () => {});
      const mk = (cls: string, html: string, title: string) => {
        const e = document.createElement("div");
        e.className = cls;
        e.innerHTML = html;
        e.title = title;
        return e;
      };
      epiRef.current = new ml.Marker({ element: mk("epi", "<i></i>", "Epicentre") })
        .setLngLat([params.lon, params.lat])
        .setPopup(new ml.Popup({ offset: 14, maxWidth: "320px" }))
        .addTo(map);
      for (const g of GAUGES) {
        const e = mk("gauge-ic" + (g.sl ? " sl" : ""), "", g.name);
        e.setAttribute("role", "button");
        e.setAttribute("aria-label", `Station ${g.name}`);
        const m = new ml.Marker({ element: e, anchor: "bottom" })
          .setLngLat([g.lon, g.lat])
          .setPopup(new ml.Popup({ offset: 12, maxWidth: "340px" }).setHTML(popupHtml(g.name, useSim.getState().run, useSim.getState().elev)))
          .addTo(map);
        e.addEventListener("click", () => useSim.getState().toggleGauge(g.name, true));
        markers.current[g.name] = m;
      }
      mapApi.openGauge = (name) => {
        const m = markers.current[name];
        if (!m) return;
        mapApi.fly(m.getLngLat().lat, m.getLngLat().lng, 8);
        setTimeout(() => {
          if (!m.getPopup()?.isOpen()) m.togglePopup();
        }, 900);
      };
      map.once("load", () => {
        mapApi.fitDomain(0);
        setReady(true);
      });
    })();
    return () => {
      disposed = true;
      roRef.current?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      mapApi.map = null;
      markers.current = {};
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- basemap switching
  const firstBm = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (firstBm.current) {
      firstBm.current = false;
      return;
    }
    map.setStyle(BASEMAPS[bm].style(), { diff: false });
  }, [bm]);

  // ---- custom layers after each style load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleGen || !fieldCanvas.current) return;
    const ls = map.getStyle().layers ?? [];
    const before = ls.find((l) => l.type === "symbol")?.id;
    if (!map.getSource("dem")) map.addSource("dem", { type: "raster-dem", tiles: [TERRARIUM], encoding: "terrarium", tileSize: 256, maxzoom: 14, attribution: DEM_ATTR });
    if (!map.getSource("demhs")) map.addSource("demhs", { type: "raster-dem", tiles: [TERRARIUM], encoding: "terrarium", tileSize: 256, maxzoom: 14 });
    if (!map.getLayer("hillshade"))
      map.addLayer({ id: "hillshade", type: "hillshade", source: "demhs", layout: { visibility: terrain ? "visible" : "none" }, paint: { "hillshade-exaggeration": 0.45 } }, before);
    if (!map.getSource("field"))
      map.addSource("field", {
        type: "canvas",
        canvas: fieldCanvas.current,
        animate: false,
        coordinates: [
          [DOM.lon0, DOM.lat1],
          [DOM.lon1, DOM.lat1],
          [DOM.lon1, DOM.lat0],
          [DOM.lon0, DOM.lat0],
        ],
      });
    if (!map.getLayer("field"))
      map.addLayer({ id: "field", type: "raster", source: "field", paint: { "raster-opacity": 0.92, "raster-fade-duration": 0, "raster-resampling": "linear" } }, before);
    if (!map.getSource("domain"))
      map.addSource("domain", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", properties: { k: "dom" }, geometry: { type: "LineString", coordinates: [[DOM.lon0, DOM.lat0], [DOM.lon1, DOM.lat0], [DOM.lon1, DOM.lat1], [DOM.lon0, DOM.lat1], [DOM.lon0, DOM.lat0]] } },
            { type: "Feature", properties: { k: "gc" }, geometry: { type: "LineString", coordinates: greatCircle(params.lat, params.lon, DONDRA.lat, DONDRA.lon) } },
          ],
        },
      });
    if (!map.getLayer("domain"))
      map.addLayer({
        id: "domain",
        type: "line",
        source: "domain",
        paint: {
          "line-color": ["match", ["get", "k"], "gc", "#4cc9f0", "#7d8db0"],
          "line-width": ["match", ["get", "k"], "gc", 1.4, 1],
          "line-dasharray": [3, 3],
          "line-opacity": 0.8,
        },
      });
    try {
      map.setTerrain(terrain ? { source: "dem", exaggeration: 1.6 } : null);
      map.setProjection({ type: globe ? "globe" : "mercator" });
    } catch {}
    poke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleGen]);

  const pokeT = useRef<ReturnType<typeof setTimeout> | null>(null);
  function poke() {
    const map = mapRef.current;
    const src = map?.getSource("field") as { play(): void; pause(): void } | undefined;
    if (!src) return;
    try {
      src.play();
      if (pokeT.current) clearTimeout(pokeT.current);
      pokeT.current = setTimeout(() => {
        try {
          src.pause();
        } catch {}
      }, 120);
    } catch {}
  }

  // ---- field redraw
  useEffect(() => {
    if (!fieldCanvas.current) return;
    renderField(fieldCanvas.current, run, live.S?.eta ?? null, layer, scaleMul);
    poke();
  }, [run, frame, layer, scaleMul, styleGen]);

  // ---- epicentre, great-circle and popups
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    epiRef.current?.setLngLat([params.lon, params.lat]);
    epiRef.current
      ?.getPopup()
      ?.setHTML(
        `<b>Source</b><br>${fmtLat(params.lat)}, ${fmtLon(params.lon)}<br>M<sub>w</sub> ${params.M.toFixed(1)} · ${MECH[params.mech].label} · strike ${params.strike}°`,
      );
    const src = map.getSource("domain") as { setData(d: unknown): void } | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { k: "dom" }, geometry: { type: "LineString", coordinates: [[DOM.lon0, DOM.lat0], [DOM.lon1, DOM.lat0], [DOM.lon1, DOM.lat1], [DOM.lon0, DOM.lat1], [DOM.lon0, DOM.lat0]] } },
        { type: "Feature", properties: { k: "gc" }, geometry: { type: "LineString", coordinates: greatCircle(params.lat, params.lon, DONDRA.lat, DONDRA.lon) } },
      ],
    });
  }, [params.lat, params.lon, params.M, params.mech, params.strike, ready, styleGen]);

  useEffect(() => {
    for (const [name, m] of Object.entries(markers.current)) m.getPopup()?.setHTML(popupHtml(name, run, elev));
  }, [run, elev, ready]);

  // ---- coastal overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleGen) return;
    if (map.getLayer("coastov")) map.removeLayer("coastov");
    if (map.getSource("coastov")) map.removeSource("coastov");
    if (overlay === "off") return;
    const R = maxRunup(run);
    const before = (map.getStyle().layers ?? []).find((l) => l.type === "symbol")?.id;
    map.addSource("coastov", {
      type: "raster",
      tiles: [`coastov://${overlay}/{z}/{x}/{y}?R=${R.toFixed(4)}`],
      tileSize: 256,
      minzoom: 7,
      maxzoom: 14,
      bounds: [79.4, 5.75, 82.1, 9.95],
    });
    map.addLayer({ id: "coastov", type: "raster", source: "coastov", paint: { "raster-fade-duration": 0 } }, before);
  }, [overlay, run, styleGen]);

  // ---- terrain / globe toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleGen) return;
    try {
      if (terrain) {
        map.setTerrain({ source: "dem", exaggeration: 1.6 });
        map.setLayoutProperty("hillshade", "visibility", "visible");
        if (map.getZoom() < 6) map.flyTo({ center: [80.75, 6.9], zoom: 8.2, pitch: 62, bearing: -20, duration: 2200 });
        else map.easeTo({ pitch: 60, duration: 900 });
      } else {
        map.setTerrain(null);
        if (map.getLayer("hillshade")) map.setLayoutProperty("hillshade", "visibility", "none");
        map.easeTo({ pitch: 0, bearing: 0, duration: 900 });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrain]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleGen) return;
    try {
      map.setProjection({ type: globe ? "globe" : "mercator" });
      if (globe) map.easeTo({ zoom: Math.min(map.getZoom(), 2.6), duration: 900 });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globe]);

  // ---- keyboard: T terrain, G globe, B basemap
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,select,textarea,[contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t" || e.key === "T") setTerrain((v) => !v);
      else if (e.key === "g" || e.key === "G") setGlobe((v) => !v);
      else if (e.key === "b" || e.key === "B") setMenu((v) => !v);
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0">
        <div ref={el} className="h-full w-full bg-[#0a1628]" aria-label="Interactive map of the model domain" />
      </div>
      {failed && <div className="absolute inset-0 grid place-items-center p-6 text-center text-warn">{failed}</div>}
      {fallbackNote && (
        <div className="glass absolute left-1/2 top-16 z-[6] w-[min(28rem,calc(100%-24px))] -translate-x-1/2 max-lg:top-[112px] px-3 py-2 text-xs text-fg-2" role="status">
          {fallbackNote}{" "}
          <button className="underline" onClick={() => setFallbackNote(null)}>
            Dismiss
          </button>
        </div>
      )}
      <div className="absolute right-[54px] top-2.5 z-[6] flex flex-col gap-1.5 max-lg:top-[60px] max-lg:left-2.5 max-lg:right-auto max-lg:items-start">
        <div className="glass flex gap-1 p-1">
          <MapBtn on={menu} onClick={() => setMenu((v) => !v)} title="Basemap (B)">🗺</MapBtn>
          <MapBtn on={terrain} onClick={() => setTerrain((v) => !v)} title="3D terrain (T)">⛰</MapBtn>
          <MapBtn on={globe} onClick={() => setGlobe((v) => !v)} title="Globe view (G)">🌐</MapBtn>
          <MapBtn onClick={() => mapApi.fitDomain()} title="Whole model domain">⤢</MapBtn>
          <MapBtn onClick={() => mapApi.fitSL()} title="Zoom to Sri Lanka">LK</MapBtn>
        </div>
        {menu && (
          <div className="glass w-60 p-2 self-end max-lg:self-start">
            <div className="eyebrow px-1 pb-1">Open basemaps</div>
            {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setBasemap(k);
                  setMenu(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left ${k === bm ? "border-accent bg-accent-soft" : "border-transparent hover:bg-panel-2"}`}
              >
                <span className="h-7 w-9 flex-none rounded-md border border-line" style={{ background: BASEMAPS[k].sw }} />
                <span className="text-sm text-fg">
                  {BASEMAPS[k].label}
                  <small className="block text-[0.72rem] text-muted">{BASEMAPS[k].desc}</small>
                </span>
              </button>
            ))}
            <p className="note px-1 pt-1.5">All free and open, no API keys. 3D terrain uses AWS Terrain Tiles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MapBtn({ on, onClick, title, children }: { on?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={on}
      className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${on ? "bg-accent-soft text-accent" : "text-fg hover:bg-panel-2"}`}
    >
      {children}
    </button>
  );
}
