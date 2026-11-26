import { DOM, DONDRA } from "./constants";
import { decodeMask, MASK_NX, MASK_NY } from "./mask";
import { hav } from "./geo";
import { buildSource, type Mechanism } from "./source";
import { analyticTown, level, TOWNS, type ThreatLevel } from "./stations";

/**
 * Catalogue of earthquake source zones in the model domain that can send a tsunami towards Sri Lanka.
 *
 * Each entry is an idealised single-plane source at a representative point of the zone: the epicentre of
 * its best-known instrumental event where there is one, otherwise a point on the plate boundary.
 * Locations are rounded to about 0.1°. They are teaching scenarios, not hazard-assessment sources.
 *
 * Events from the Sunda (Java) trench east of 105° E, and landslide or volcanic sources, are not included.
 */
export type SourceSetting = "subduction" | "intraplate" | "ridge" | "transform";

export interface SourceZone {
  id: string;
  setting: SourceSetting;
  lat: number;
  lon: number;
  /** Representative magnitude for the scenario (a past event, or a plausible large event). */
  M: number;
  /** Largest magnitude considered credible for the zone in the literature (rounded). */
  Mmax: number;
  mech: Mechanism;
  /** Strike (° from N, right-hand rule: the fault dips to the right of the strike direction). */
  strike: number;
  /** Notable past events: year and moment magnitude (a range where estimates differ). */
  events: { year: number; M: string; tsunami?: boolean }[];
  refs: string[];
  /** Opens a built-in scenario instead of a hypothetical source. */
  scenario?: "actual" | "v2004";
}

export const SOURCE_ZONES: SourceZone[] = [
  // ---- Subduction zones (thrust): the sources of all damaging Indian Ocean tsunamis
  { id: "makranW", setting: "subduction", lat: 24.9, lon: 59.5, M: 8.3, Mmax: 8.8, mech: "thrust", strike: 265, events: [], refs: ["Byrne et al. (1992)", "Smith et al. (2013)"] },
  { id: "makranE", setting: "subduction", lat: 24.5, lon: 63.0, M: 8.1, Mmax: 8.8, mech: "thrust", strike: 265, events: [{ year: 1945, M: "8.1", tsunami: true }], refs: ["Byrne et al. (1992)"] },
  { id: "arakan", setting: "subduction", lat: 19.5, lon: 93.0, M: 8.5, Mmax: 8.8, mech: "thrust", strike: 340, events: [{ year: 1762, M: "8.5–8.8", tsunami: true }], refs: ["Wang et al. (2013)"] },
  { id: "andaman", setting: "subduction", lat: 12.5, lon: 92.3, M: 8.5, Mmax: 9.0, mech: "thrust", strike: 350, events: [{ year: 1941, M: "7.7–8.1" }], refs: ["Okal (2019)"] },
  { id: "nicobar", setting: "subduction", lat: 9.2, lon: 92.4, M: 8.0, Mmax: 9.0, mech: "thrust", strike: 340, events: [{ year: 1881, M: "7.9", tsunami: true }], refs: ["Ortiz & Bilham (2003)"] },
  { id: "sumandaman", setting: "subduction", lat: 8.0, lon: 93.0, M: 9.1, Mmax: 9.2, mech: "thrust", strike: 340, events: [{ year: 2004, M: "9.1", tsunami: true }], refs: ["Lay et al. (2005)"], scenario: "v2004" },
  { id: "aceh", setting: "subduction", lat: 3.3, lon: 95.5, M: 8.8, Mmax: 9.2, mech: "thrust", strike: 320, events: [{ year: 2004, M: "9.1", tsunami: true }], refs: ["Lay et al. (2005)"] },
  { id: "nias", setting: "subduction", lat: 2.1, lon: 97.1, M: 8.6, Mmax: 8.8, mech: "thrust", strike: 315, events: [{ year: 1861, M: "8.5", tsunami: true }, { year: 2005, M: "8.6", tsunami: true }], refs: ["Briggs et al. (2006)"] },
  { id: "mentawai", setting: "subduction", lat: -2.5, lon: 99.4, M: 8.8, Mmax: 9.0, mech: "thrust", strike: 325, events: [{ year: 1797, M: "8.5–8.7", tsunami: true }, { year: 1833, M: "8.6–8.9", tsunami: true }, { year: 2010, M: "7.8", tsunami: true }], refs: ["Natawidjaja et al. (2006)", "Hill et al. (2012)"] },
  { id: "bengkulu", setting: "subduction", lat: -4.4, lon: 101.4, M: 8.4, Mmax: 8.7, mech: "thrust", strike: 328, events: [{ year: 2007, M: "8.4", tsunami: true }], refs: ["Konca et al. (2008)"] },
  // ---- Intraplate (oceanic lithosphere of the Indian and Australian plates)
  { id: "wharton2012", setting: "intraplate", lat: 2.3, lon: 93.1, M: 8.6, Mmax: 8.6, mech: "strike", strike: 20, events: [{ year: 2012, M: "8.6", tsunami: true }], refs: ["Meng et al. (2012)"] },
  { id: "wharton2000", setting: "intraplate", lat: -13.8, lon: 97.45, M: 7.9, Mmax: 8.0, mech: "strike", strike: 160, events: [{ year: 2000, M: "7.9" }], refs: ["Abercrombie et al. (2003)"] },
  { id: "ninetyeast", setting: "intraplate", lat: -6.0, lon: 89.0, M: 7.5, Mmax: 7.8, mech: "strike", strike: 0, events: [], refs: ["Stein & Okal (1978)"] },
  { id: "chagos", setting: "intraplate", lat: -6.85, lon: 72.1, M: 7.7, Mmax: 7.8, mech: "normal", strike: 170, events: [{ year: 1983, M: "7.7", tsunami: true }], refs: ["ISC-GEM"] },
  // ---- Mid-ocean ridges (normal faulting on spreading segments): small waves
  { id: "carlsberg", setting: "ridge", lat: 4.5, lon: 62.2, M: 7.0, Mmax: 7.5, mech: "normal", strike: 135, events: [], refs: ["ISC-GEM"] },
  { id: "cirNorth", setting: "ridge", lat: -9.5, lon: 67.0, M: 7.0, Mmax: 7.5, mech: "normal", strike: 165, events: [], refs: ["ISC-GEM"] },
  { id: "cirBulletin", setting: "ridge", lat: -17.78, lon: 65.82, M: 6.5, Mmax: 7.5, mech: "normal", strike: 160, events: [{ year: 2026, M: "6.5" }], refs: ["Bulletin No. 02"], scenario: "actual" },
  { id: "rtj", setting: "ridge", lat: -25.5, lon: 70.0, M: 7.0, Mmax: 7.5, mech: "normal", strike: 140, events: [], refs: ["ISC-GEM"] },
  { id: "seir", setting: "ridge", lat: -26.9, lon: 73.5, M: 7.0, Mmax: 7.5, mech: "normal", strike: 120, events: [], refs: ["ISC-GEM"] },
  { id: "swir", setting: "ridge", lat: -26.8, lon: 67.6, M: 7.0, Mmax: 7.5, mech: "normal", strike: 50, events: [], refs: ["ISC-GEM"] },
  // ---- Transform plate boundary
  { id: "owen", setting: "transform", lat: 14.5, lon: 57.9, M: 7.3, Mmax: 7.6, mech: "strike", strike: 20, events: [], refs: ["Fournier et al. (2011)"] },
];

export const SETTINGS: SourceSetting[] = ["subduction", "intraplate", "ridge", "transform"];
export const SETTING_COLOR: Record<SourceSetting, string> = { subduction: "#e5484d", intraplate: "#f5a524", ridge: "#3b82f6", transform: "#a855f7" };

export const zoneById = (id: string) => SOURCE_ZONES.find((z) => z.id === id);

/** The catalogue entry at (approximately) this location, if any. */
export const zoneAt = (lat: number, lon: number) => SOURCE_ZONES.find((z) => Math.abs(z.lat - lat) < 0.05 && Math.abs(z.lon - lon) < 0.05);

export type MagMode = "typical" | "max" | "fixed";

export interface ZoneImpact {
  zone: SourceZone;
  M: number;
  /** Great-circle distance to Dondra Head (km). */
  dist: number;
  /** Earliest analytic arrival at any Sri Lankan station (min). */
  eta: number;
  etaAt: string;
  /** Largest empirical run-up (Abe 1989 Ht) at any Sri Lankan station (m). */
  H: number;
  Hat: string;
  lv: ThreatLevel;
}

/**
 * Fast empirical comparison of every source at Sri Lanka (Abe 1981/1989 with island shadowing; see stations.ts).
 * Useful for ranking and teaching; the numerical model is the reference for any single source.
 */
export function compareZones(mode: MagMode, fixedM = 8.0): ZoneImpact[] {
  return SOURCE_ZONES.map((zone) => {
    const M = mode === "max" ? zone.Mmax : mode === "fixed" ? fixedM : zone.M;
    const src = buildSource({ scen: "whatif", lat: zone.lat, lon: zone.lon, M, mech: zone.mech, strike: zone.strike });
    let H = 0,
      Hat = "",
      eta = Infinity,
      etaAt = "";
    for (const t of TOWNS) {
      const a = analyticTown(t, src);
      if (a.H89 > H) {
        H = a.H89;
        Hat = t.name;
      }
      if (a.eta < eta) {
        eta = a.eta;
        etaAt = t.name;
      }
    }
    return { zone, M, dist: hav(zone.lat, zone.lon, DONDRA.lat, DONDRA.lon), eta, etaAt, H, Hat, lv: level(H) };
  }).sort((a, b) => b.H - a.H);
}

// ---- custom sources -------------------------------------------------------------------------------


/** Keep a custom epicentre inside the model domain, clear of the 14-cell absorbing sponge. */
export const SOURCE_BOUNDS = { lat0: DOM.lat0 + 3, lat1: DOM.lat1 - 3, lon0: DOM.lon0 + 3, lon1: DOM.lon1 - 3 } as const;

export function clampToDomain(lat: number, lon: number) {
  const c = {
    lat: Math.round(Math.max(SOURCE_BOUNDS.lat0, Math.min(SOURCE_BOUNDS.lat1, lat)) * 100) / 100,
    lon: Math.round(Math.max(SOURCE_BOUNDS.lon0, Math.min(SOURCE_BOUNDS.lon1, lon)) * 100) / 100,
  };
  return { ...c, clamped: Math.abs(c.lat - lat) > 0.006 || Math.abs(c.lon - lon) > 0.006 };
}

let MASK: Uint8Array | null = null;
/** True when the point falls on land in the model's 10′ land mask (Natural Earth). */
export function isOverLand(lat: number, lon: number): boolean {
  MASK ??= decodeMask();
  const i = Math.round((lon - DOM.lon0) * 6),
    j = Math.round((lat - DOM.lat0) * 6);
  if (i < 0 || j < 0 || i >= MASK_NX || j >= MASK_NY) return false;
  return MASK[j * MASK_NX + i] === 1;
}
