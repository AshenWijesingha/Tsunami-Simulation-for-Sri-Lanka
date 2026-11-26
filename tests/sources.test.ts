import { describe, expect, it } from "vitest";
import { DOM } from "@/lib/physics/constants";
import { decodeMask, MASK_NX } from "@/lib/physics/mask";
import { compareZones, SOURCE_ZONES } from "@/lib/physics/sources";
import { SCENARIOS } from "@/lib/physics/source";

const mask = decodeMask();
const landAt = (lat: number, lon: number) => mask[Math.round((lat - DOM.lat0) * 6) * MASK_NX + Math.round((lon - DOM.lon0) * 6)] === 1;

describe("source catalogue", () => {
  it("has unique ids", () => expect(new Set(SOURCE_ZONES.map((z) => z.id)).size).toBe(SOURCE_ZONES.length));

  it.each(SOURCE_ZONES.map((z) => [z.id, z] as const))("%s lies inside the model domain, clear of the sponge layer", (_, z) => {
    expect(z.lat).toBeGreaterThanOrEqual(DOM.lat0 + 3);
    expect(z.lat).toBeLessThanOrEqual(DOM.lat1 - 3);
    expect(z.lon).toBeGreaterThanOrEqual(DOM.lon0 + 3);
    expect(z.lon).toBeLessThanOrEqual(DOM.lon1 - 3);
  });

  it.each(SOURCE_ZONES.map((z) => [z.id, z] as const))("%s is centred over the sea", (_, z) => expect(landAt(z.lat, z.lon)).toBe(false));

  it("magnitudes are ordered and plausible", () => {
    for (const z of SOURCE_ZONES) {
      expect(z.M).toBeLessThanOrEqual(z.Mmax);
      expect(z.M).toBeGreaterThanOrEqual(6.5);
      expect(z.Mmax).toBeLessThanOrEqual(9.3);
    }
  });

  it("built-in scenarios match their catalogue entries", () => {
    for (const z of SOURCE_ZONES.filter((x) => x.scenario)) {
      const sc = SCENARIOS[z.scenario!];
      expect([sc.lat, sc.lon, sc.M, sc.mech]).toEqual([z.lat, z.lon, z.M, z.mech]);
    }
  });

  it("ranks Sunda megathrust sources above mid-ocean ridges at Sri Lanka", () => {
    const r = compareZones("typical");
    const rank = (id: string) => r.findIndex((x) => x.zone.id === id);
    expect(rank("aceh")).toBeLessThan(rank("carlsberg"));
    expect(rank("sumandaman")).toBeLessThan(rank("cirBulletin"));
    // the actual bulletin event stays far below the 0.3 m threshold
    expect(r.find((x) => x.zone.id === "cirBulletin")!.H).toBeLessThan(0.01);
    // 2004-type source: metre-scale run-up, east coast first
    const s04 = r.find((x) => x.zone.id === "sumandaman")!;
    expect(s04.H).toBeGreaterThan(1);
    expect(s04.eta).toBeGreaterThan(90);
    expect(s04.eta).toBeLessThan(180);
  });
});
