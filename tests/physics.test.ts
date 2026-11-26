import { describe, expect, it } from "vitest";
import { EPI, C_PATH, GREEN10 } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { abe81, abe89, buildSource, DEFAULT_PARAMS, mwForHeight, SCENARIOS } from "@/lib/physics/source";
import { analyticTown, level, TOWNS } from "@/lib/physics/stations";
import { cgNorm, cpNorm, runMonteCarlo, DEFAULT_MC } from "@/lib/physics/waves";
import { simulate } from "@/lib/physics/simulate";
import { buildBathymetry } from "@/lib/physics/bathymetry";
import { makeSolver, initialCondition } from "@/lib/physics/solver";

describe("constants and geometry", () => {
  it("long-wave speed at 4 km ≈ 198 m/s", () => expect(C_PATH).toBeCloseTo(198.1, 0));
  it("Green's law 4000→10 m ≈ 4.47", () => expect(GREEN10).toBeCloseTo(4.47, 2));
  it("epicentre to Dondra Head ≈ 3,090 km", () => {
    const d = hav(EPI.lat, EPI.lon, 5.92, 80.59);
    expect(d).toBeGreaterThan(3000);
    expect(d).toBeLessThan(3150);
  });
});

describe("source scaling", () => {
  it("M6.5 normal: Wells & Coppersmith dimensions and Hanks–Kanamori moment", () => {
    const s = buildSource(DEFAULT_PARAMS);
    expect(s.L).toBeCloseTo(Math.pow(10, -2.44 + 0.59 * 6.5), 6);
    expect(s.W).toBeCloseTo(Math.pow(10, -1.01 + 0.32 * 6.5), 6);
    expect(s.Mo).toBeCloseTo(Math.pow(10, 18.85), -14);
    expect(s.Mt).toBeCloseTo(6.2, 6);
    expect(s.kh).toBeGreaterThan(0.5); // dispersive regime for the small source
  });
  it("2004 validation uses the prescribed 1,300 × 150 km plane", () => {
    const s = buildSource({ ...DEFAULT_PARAMS, scen: "v2004", lat: 8, lon: 93, M: 9.1, mech: "thrust", strike: 340 });
    expect(s.L).toBe(1300);
    expect(s.W).toBe(150);
    expect(s.kh).toBeLessThan(0.1);
  });
  it("Abe (1989) exceeds Abe (1981) by 10^0.25", () => expect(abe89(3000, 7) / abe81(3000, 7)).toBeCloseTo(Math.pow(10, 0.25), 6));
  it("magnitude needed for 0.3 m at 3,090 km (thrust) ≈ 8.5", () => expect(mwForHeight(0.3, 3090, "thrust")).toBeCloseTo(8.52, 1));
});

describe("analytic coastal model", () => {
  const s = buildSource(DEFAULT_PARAMS);
  it("actual event is far below 0.3 m at every station", () => {
    for (const t of TOWNS) {
      const a = analyticTown(t, s);
      expect(a.H89).toBeLessThan(0.01);
      expect(level(a.H89).k).toBe("none");
    }
  });
  it("east coast is sheltered for a western source", () => {
    expect(analyticTown(TOWNS.find((t) => t.name === "Batticaloa")!, s).shelter).toBe(true);
    expect(analyticTown(TOWNS.find((t) => t.name === "Galle")!, s).shelter).toBe(false);
  });
});

describe("dispersion", () => {
  it("long-wave limit → 1", () => {
    expect(cpNorm(1e-4)).toBeCloseTo(1, 6);
    expect(cgNorm(1e-4)).toBeCloseTo(1, 6);
  });
  it("group speed below phase speed for finite kh", () => expect(cgNorm(0.7)).toBeLessThan(cpNorm(0.7)));
});

describe("Monte Carlo", () => {
  it("is reproducible for a seed and gives negligible exceedance for the actual event", () => {
    const a = runMonteCarlo({ ...DEFAULT_MC, n: 2000 });
    const b = runMonteCarlo({ ...DEFAULT_MC, n: 2000 });
    expect(a.p.a50).toBe(b.p.a50);
    expect(a.p.pExceed).toBe(0);
    expect(a.p.a50).toBeLessThan(0.01);
  });
});

describe("numerical solver (fallback bathymetry, 10′)", () => {
  it("CFL time step and wet cells are sensible", async () => {
    const B = await buildBathymetry(10, "fallback", () => {});
    expect(B.nx).toBe(301);
    expect(B.ny).toBe(331);
    const G = makeSolver(B);
    expect(G.dt).toBeGreaterThan(5);
    expect(G.dt).toBeLessThan(60);
    expect(G.wetCount / G.N).toBeGreaterThan(0.5);
    const S = G.state();
    const ic = initialCondition(G, S, buildSource(DEFAULT_PARAMS));
    expect(ic.volF).toBeLessThan(1); // sub-grid source gets widened
    expect(ic.peak).toBeGreaterThan(0);
  });
  it("actual event: millimetre-scale waves reach Sri Lanka after ~4 h", async () => {
    const run = await simulate({ ...DEFAULT_PARAMS, bathy: "fallback" }, () => {});
    expect(run).not.toBeNull();
    const sl = run!.gauges.filter((q) => TOWNS.some((t) => t.name === q.name) && q.snap);
    expect(sl.length).toBeGreaterThan(15);
    const maxGreen = Math.max(...sl.map((q) => q.green1));
    expect(maxGreen).toBeLessThan(0.05);
    const first = Math.min(...sl.map((q) => q.etaShore).filter(Number.isFinite));
    expect(first).toBeGreaterThan(200);
    expect(first).toBeLessThan(330);
  }, 120_000);
  it("2004 validation: east-coast arrival within ±40 min of the observed ~2 h", async () => {
    const sc = SCENARIOS.v2004;
    const run = await simulate({ ...DEFAULT_PARAMS, scen: "v2004", lat: sc.lat, lon: sc.lon, M: 9.1, mech: "thrust", strike: 340, bathy: "fallback", dur: 300 }, () => {});
    const bat = run!.gauges.find((q) => q.name === "Batticaloa")!;
    expect(bat.etaShore).toBeGreaterThan(80);
    expect(bat.etaShore).toBeLessThan(160);
  }, 120_000);
});
