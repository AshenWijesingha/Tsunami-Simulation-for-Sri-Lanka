import { describe, expect, it } from "vitest";
import { SRI_LANKA_BBOX, SRI_LANKA_MAIN_FULL, SRI_LANKA_RINGS, REGION_LAND } from "@/lib/geo/coastlines";
import { MARK_ISLAND_PATH } from "@/lib/geo/mark";
import { DONDRA } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { TOWNS } from "@/lib/physics/stations";

/** Distance (km) from a point to the nearest segment of any ring (local flat-earth approximation). */
function distToCoastKm(lat: number, lon: number, rings: [number, number][][]) {
  const k = Math.cos((lat * Math.PI) / 180) * 111.32,
    ky = 110.57;
  let best = Infinity;
  for (const ring of rings)
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[(i + 1) % ring.length];
      const px = (lon - ax) * k,
        py = (lat - ay) * ky,
        dx = (bx - ax) * k,
        dy = (by - ay) * ky;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(px - t * dx, py - t * dy));
    }
  return best;
}

describe("Sri Lanka coastline (Natural Earth 1:10m)", () => {
  it("matches the island's surveyed extreme points", () => {
    // Point Pedro (north) ≈ 9.83° N; Dondra Head (south) ≈ 5.92° N; Sangamankanda Point (east) ≈ 81.88° E;
    // the westernmost land is Delft and the Jaffna islands (≈ 79.66° E).
    expect(SRI_LANKA_BBOX.north).toBeCloseTo(9.83, 1);
    expect(SRI_LANKA_BBOX.south).toBeCloseTo(5.92, 1);
    expect(SRI_LANKA_BBOX.east).toBeCloseTo(81.88, 1);
    expect(SRI_LANKA_BBOX.west).toBeGreaterThan(79.6);
    expect(SRI_LANKA_BBOX.west).toBeLessThan(79.72);
  });

  it("includes the offshore islands (Mannar, Delft, Jaffna islands)", () => {
    expect(SRI_LANKA_RINGS.length).toBeGreaterThanOrEqual(5);
    const mannar = SRI_LANKA_RINGS.some((r) => r.some(([x, y]) => x < 79.75 && y > 8.95 && y < 9.12));
    expect(mannar).toBe(true);
  });

  it("main island has full 1:10m detail", () => expect(SRI_LANKA_MAIN_FULL.length).toBeGreaterThan(600));

  it("Dondra Head reference point lies on the coast", () => {
    expect(distToCoastKm(DONDRA.lat, DONDRA.lon, SRI_LANKA_RINGS)).toBeLessThan(2);
    expect(hav(DONDRA.lat, DONDRA.lon, SRI_LANKA_BBOX.south, 80.59)).toBeLessThan(2);
  });

  it.each(TOWNS.map((t) => [t.name, t.lat, t.lon] as const))("station %s is on the coast (< 3 km)", (_n, lat, lon) => {
    expect(distToCoastKm(lat, lon, SRI_LANKA_RINGS)).toBeLessThan(3);
  });
});

describe("logo mark", () => {
  const nums = [...MARK_ISLAND_PATH.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  const xs = nums.map((p) => p[0]),
    ys = nums.map((p) => p[1]);
  it("keeps Sri Lanka's true aspect ratio (equal ground scale in x and y)", () => {
    const w = Math.max(...xs) - Math.min(...xs),
      h = Math.max(...ys) - Math.min(...ys);
    const mid = ((SRI_LANKA_BBOX.north + SRI_LANKA_BBOX.south) / 2) * (Math.PI / 180);
    const truth = ((SRI_LANKA_BBOX.east - SRI_LANKA_BBOX.west) * Math.cos(mid)) / (SRI_LANKA_BBOX.north - SRI_LANKA_BBOX.south);
    expect(w / h).toBeCloseTo(truth, 2);
  });
  it("fits inside the 64-unit tile", () => {
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(64);
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(Math.max(...ys)).toBeLessThan(64);
  });
});

describe("regional land for the hero map", () => {
  it("contains India, Sri Lanka, Madagascar and Sumatra", () => {
    const hit = (lon: number, lat: number) => REGION_LAND.some((r) => r.some(([x, y]) => Math.abs(x - lon) < 1.5 && Math.abs(y - lat) < 1.5));
    expect(hit(77.5, 8.1)).toBe(true); // Cape Comorin, India
    expect(hit(80.6, 5.95)).toBe(true); // Sri Lanka
    expect(hit(49.3, -12.0)).toBe(true); // Madagascar (north tip)
    expect(hit(95.3, 5.6)).toBe(true); // Banda Aceh, Sumatra
  });
});
