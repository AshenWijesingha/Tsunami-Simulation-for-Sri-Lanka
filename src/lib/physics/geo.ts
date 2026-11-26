import { R_KM } from "./constants";

export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle (haversine) distance in km. */
export function hav(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = rad(lat1),
    p2 = rad(lat2),
    dp = rad(lat2 - lat1),
    dl = rad(lon2 - lon1);
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(x)));
}

/** Initial great-circle bearing (degrees clockwise from north). */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = rad(lat1),
    p2 = rad(lat2),
    dl = rad(lon2 - lon1);
  return (
    (deg(
      Math.atan2(
        Math.sin(dl) * Math.cos(p2),
        Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl),
      ),
    ) +
      360) %
    360
  );
}

/** Destination point given start, bearing (deg) and distance (km). Returns [lat, lon]. */
export function dest(lat: number, lon: number, brg: number, dkm: number): [number, number] {
  const d = dkm / R_KM,
    t = rad(brg),
    p1 = rad(lat),
    l1 = rad(lon);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
  const l2 =
    l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [deg(p2), ((deg(l2) + 540) % 360) - 180];
}

/** Great-circle polyline as [lon, lat] pairs (GeoJSON order). */
export function greatCircle(lat1: number, lon1: number, lat2: number, lon2: number, n = 80): [number, number][] {
  const D = hav(lat1, lon1, lat2, lon2),
    B = bearing(lat1, lon1, lat2, lon2);
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const p = dest(lat1, lon1, B, (D * i) / n);
    out.push([p[1], p[0]]);
  }
  return out;
}

export const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));

export function fmtLat(lat: number, dp = 2) {
  return `${Math.abs(lat).toFixed(dp)}° ${lat < 0 ? "S" : "N"}`;
}
export function fmtLon(lon: number, dp = 2) {
  return `${Math.abs(lon).toFixed(dp)}° ${lon < 0 ? "W" : "E"}`;
}
