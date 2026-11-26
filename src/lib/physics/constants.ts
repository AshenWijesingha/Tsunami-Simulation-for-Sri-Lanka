/** Physical constants and model domain. SI units unless the name says otherwise. */

/** Epicentre of the 24 Nov 2026 M6.5 event (Department of Meteorology, Bulletin No. 02). */
export const EPI = { lat: -17.78, lon: 65.82 } as const;

/** Model domain: 50–105° E, 30° S – 28° N. */
export const DOM = { lon0: 50, lon1: 105, lat0: -30, lat1: 28 } as const;

export const g = 9.81; // m s^-2
export const R_E = 6371e3; // m
export const R_KM = 6371; // km
export const MU = 3e10; // Pa, crustal rigidity

/** Path-averaged ocean depth used by the analytic/empirical model (m). */
export const H_PATH = 4000;
/** Long-wave speed at H_PATH (m/s). */
export const C_PATH = Math.sqrt(g * H_PATH);
/** Same, in km/min. */
export const C_KMMIN = (C_PATH * 60) / 1000;
/** Green's-law gain from H_PATH to 10 m depth. */
export const GREEN10 = Math.pow(H_PATH / 10, 0.25);

/** Reference shoreline point (Dondra Head, southern tip of Sri Lanka). */
export const DONDRA = { lat: 5.92, lon: 80.59 } as const;

/** Sri Lanka bounding box (S, W, N, E). */
export const SL_BOUNDS = { s: 5.85, w: 79.6, n: 9.85, e: 81.95 } as const;
