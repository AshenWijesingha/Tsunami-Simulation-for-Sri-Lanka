import { C_KMMIN } from "./constants";
import { hav } from "./geo";
import { abe81, abe89, type Source } from "./source";

export type CoastGroup = "south" | "west" | "northwest" | "north" | "east";

export interface Station {
  name: string;
  lat: number;
  lon: number;
  /** Approximate ground elevation (m); may be replaced by a live DEM value. */
  elev?: number;
  group?: CoastGroup;
  district?: string;
  /** true = Sri Lankan coastal station. */
  sl: boolean;
}

export const GROUPS: Record<CoastGroup, string> = {
  south: "South",
  west: "West & SW",
  northwest: "North-west",
  east: "East",
  north: "North",
};

const T = (name: string, lat: number, lon: number, elev: number, group: CoastGroup, district: string): Station => ({
  name,
  lat,
  lon,
  elev,
  group,
  district,
  sl: true,
});

/** Sri Lankan coastal stations (shoreline coordinates). */
export const TOWNS: Station[] = [
  T("Dondra Head", 5.923, 80.59, 6, "south", "Matara"),
  T("Matara", 5.949, 80.535, 4, "south", "Matara"),
  T("Weligama", 5.974, 80.43, 4, "south", "Matara"),
  T("Tangalle", 6.024, 80.796, 6, "south", "Hambantota"),
  T("Hambantota", 6.124, 81.119, 10, "south", "Hambantota"),
  T("Galle", 6.033, 80.217, 5, "west", "Galle"),
  T("Hikkaduwa", 6.14, 80.099, 3, "west", "Galle"),
  T("Bentota", 6.425, 79.996, 3, "west", "Galle"),
  T("Kalutara", 6.585, 79.961, 4, "west", "Kalutara"),
  T("Colombo", 6.934, 79.843, 5, "west", "Colombo"),
  T("Negombo", 7.208, 79.836, 2, "west", "Gampaha"),
  T("Chilaw", 7.576, 79.795, 3, "west", "Puttalam"),
  T("Kalpitiya", 8.23, 79.765, 2, "northwest", "Puttalam"),
  T("Mannar", 8.981, 79.904, 3, "northwest", "Mannar"),
  T("Jaffna (Point Pedro)", 9.83, 80.235, 5, "north", "Jaffna"),
  T("Mullaitivu", 9.267, 80.814, 4, "east", "Mullaitivu"),
  T("Trincomalee", 8.587, 81.215, 8, "east", "Trincomalee"),
  T("Batticaloa", 7.731, 81.675, 4, "east", "Batticaloa"),
  T("Kalmunai", 7.409, 81.836, 4, "east", "Ampara"),
  T("Arugam Bay", 6.84, 81.83, 3, "east", "Ampara"),
  T("Kirinda", 6.218, 81.338, 5, "east", "Hambantota"),
];

/** Regional virtual gauges for context. */
export const REGIONAL: Station[] = (
  [
    ["Rodrigues", -19.68, 63.42],
    ["Port Louis, Mauritius", -20.16, 57.5],
    ["Réunion", -20.94, 55.29],
    ["Diego Garcia", -7.3, 72.4],
    ["Malé, Maldives", 4.18, 73.52],
    ["Kochi, India", 9.97, 76.26],
    ["Chennai, India", 13.08, 80.29],
    ["Virtual deep buoy (0°, 75° E)", 0.0, 75.0],
  ] as [string, number, number][]
).map(([name, lat, lon]) => ({ name, lat, lon, sl: false }));

export const GAUGES: Station[] = [...TOWNS, ...REGIONAL];

// Way-points used to route the analytic path around the island to sheltered coasts.
const WP_SOUTH: [number, number] = [5.65, 80.6];
const WP_SE: [number, number] = [6.1, 81.95];
const WP_W: [number, number] = [6.5, 79.6];

export interface AnalyticResult {
  /** Path length used (km). */
  dist: number;
  /** Direct great-circle distance (km). */
  direct: number;
  shelter: boolean;
  /** Analytic arrival time (min), includes 15 min shelf transit. */
  eta: number;
  H81: number;
  H89: number;
}

/**
 * Empirical/analytic estimate for a coastal station. Coasts facing away from the source are
 * reached by a path around the island and get a ×0.5 shelter factor (a teaching assumption).
 */
export function analyticTown(t: Station, s: Pick<Source, "lat" | "lon" | "Mt">): AnalyticResult {
  const fromWest = s.lon < 80.5;
  const direct = hav(s.lat, s.lon, t.lat, t.lon);
  let dist = direct,
    shelter = false;
  if (t.sl && fromWest && (t.group === "east" || t.group === "north")) {
    shelter = true;
    dist =
      hav(s.lat, s.lon, WP_SOUTH[0], WP_SOUTH[1]) +
      hav(WP_SOUTH[0], WP_SOUTH[1], WP_SE[0], WP_SE[1]) +
      hav(WP_SE[0], WP_SE[1], t.lat, t.lon);
  } else if (t.sl && !fromWest && (t.group === "west" || t.group === "northwest")) {
    shelter = true;
    dist =
      hav(s.lat, s.lon, WP_SOUTH[0], WP_SOUTH[1]) +
      hav(WP_SOUTH[0], WP_SOUTH[1], WP_W[0], WP_W[1]) +
      hav(WP_W[0], WP_W[1], t.lat, t.lon);
  }
  const f = shelter ? 0.5 : 1;
  return { dist, direct, shelter, eta: dist / C_KMMIN + 15, H81: abe81(dist, s.Mt) * f, H89: abe89(dist, s.Mt) * f };
}

export interface ThreatLevel {
  k: "none" | "marine" | "land" | "major";
  label: string;
  col: string;
  max: number;
  desc: string;
}

/** PTWC-style threat categories (NOAA/ITIC TsuCAT). */
export const LEVELS: ThreatLevel[] = [
  { k: "none", label: "No threat", col: "#2ec27e", max: 0.3, desc: "< 0.3 m: information only; no action needed." },
  { k: "marine", label: "Marine threat", col: "#f6c343", max: 1, desc: "0.3–1 m: hazardous currents. Keep people out of the water and off beaches." },
  { k: "land", label: "Land threat", col: "#f08a24", max: 3, desc: "1–3 m: flooding of low-lying coast. Evacuate low areas." },
  { k: "major", label: "Major threat", col: "#e5484d", max: Infinity, desc: "> 3 m: widespread inundation. Large-scale evacuation." },
];
export const level = (h: number): ThreatLevel => LEVELS.find((l) => h < l.max) ?? LEVELS[3];
