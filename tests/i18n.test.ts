import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dict/en";
import { si } from "@/i18n/dict/si";
import { ta } from "@/i18n/dict/ta";
import { GAUGES } from "@/lib/physics/stations";

type Leaf = [path: string, value: string];
function leaves(o: unknown, p = ""): Leaf[] {
  if (typeof o === "string") return [[p, o]];
  if (Array.isArray(o)) return o.flatMap((v, i) => leaves(v, `${p}[${i}]`));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => leaves(v, p ? `${p}.${k}` : k));
  return [];
}
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe.each([
  ["si", si],
  ["ta", ta],
])("%s dictionary", (_, dict) => {
  const base = new Map(leaves({ ...en, places: {} }));
  const tr = new Map(leaves({ ...dict, places: {} }));

  it("has every English key", () => {
    const missing = [...base.keys()].filter((k) => !tr.has(k));
    expect(missing).toEqual([]);
  });

  it("keeps the same {placeholders} in every string", () => {
    const bad = [...base].filter(([k, v]) => tr.has(k) && holes(v).join() !== holes(tr.get(k)!).join()).map(([k]) => k);
    expect(bad).toEqual([]);
  });

  it("keeps quiz answers aligned (4 options each, same count)", () => {
    expect(dict.exercises.quiz.items.length).toBe(en.exercises.quiz.items.length);
    for (const q of dict.exercises.quiz.items) expect(q.a.length).toBe(4);
  });

  it("names every tide-gauge station", () => {
    const missing = GAUGES.map((g) => g.name).filter((n) => !dict.places[n]);
    expect(missing).toEqual([]);
  });
});
