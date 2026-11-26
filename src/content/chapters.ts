import type { ScenarioId } from "@/lib/physics/source";
import type { Layer } from "@/lib/sim/store";

export type View = "domain" | "sl" | "source" | "basin" | "east" | "v2004" | "coast";

export interface ChapterMeta {
  slug: string;
  k: string;
  title: string;
  summary: string;
  /** Estimated reading time (min). */
  minutes: number;
  sim?: { scen?: ScenarioId; layer?: Layer; view?: View; play?: boolean; tab?: string };
}

export const CHAPTERS: ChapterMeta[] = [
  { slug: "overview", minutes: 3, k: "Overview", title: "Far-field tsunami hazard from a Central Indian Ridge earthquake", summary: "Learning outcomes and the research question behind an operational ‘No Tsunami Threat’ decision.", sim: { scen: "actual", layer: "eta", view: "domain" } },
  { slug: "bulletin", minutes: 3, k: "1 · Data", title: "Observation: the bulletin", summary: "What forecasters knew at t + 65 min, and what they could not know.", sim: { scen: "actual", layer: "off", view: "basin" } },
  { slug: "tectonics", minutes: 4, k: "2 · Source", title: "Tectonic setting & source mechanism", summary: "Why mechanism matters as much as magnitude on a spreading ridge.", sim: { scen: "actual", layer: "bathy", view: "source" } },
  { slug: "generation", minutes: 4, k: "3 · Generation", title: "Source model from scaling relations", summary: "From Mw to rupture size, slip, seafloor displacement and initial sea surface.", sim: { scen: "actual", layer: "eta", view: "source" } },
  { slug: "method", minutes: 4, k: "4 · Method", title: "Governing equations & numerical scheme", summary: "Linear shallow-water equations on the sphere, C-grid, CFL stability.", sim: { layer: "bathy", view: "domain" } },
  { slug: "propagation", minutes: 4, k: "5 · Propagation", title: "Propagation across the basin", summary: "Speed, refraction over ridges and plateaus, spreading and directivity.", sim: { layer: "eta", view: "domain", play: true } },
  { slug: "dispersion", minutes: 5, k: "6 · Dispersion", title: "Frequency dispersion: a key limitation for small sources", summary: "When λ/h < 20, the long-wave model overestimates amplitude and arrives early.", sim: { tab: "model" } },
  { slug: "coast", minutes: 4, k: "7 · Coast", title: "Shoaling & coastal amplification", summary: "Green's law, empirical Abe relations and the island's shadow.", sim: { layer: "max", view: "coast" } },
  { slug: "results", minutes: 3, k: "8 · Results", title: "Results for Sri Lanka", summary: "Two independent approaches, one conclusion.", sim: { scen: "actual", layer: "max", view: "basin", tab: "results" } },
  { slug: "uncertainty", minutes: 4, k: "9 · Uncertainty", title: "Uncertainty & sensitivity", summary: "What would it take to threaten Sri Lanka from this location?" },
  { slug: "validation", minutes: 3, k: "10 · Validation", title: "Validation: 2004 Sumatra–Andaman tsunami", summary: "Same code, Mw 9.1 megathrust: travel times reproduced, amplitudes not.", sim: { scen: "v2004", layer: "eta", view: "v2004" } },
  { slug: "discussion", minutes: 4, k: "11 · Discussion", title: "Limitations & research directions", summary: "Source, physics, resolution, coast, operations — and suggested projects.", sim: { scen: "actual", layer: "tt", view: "domain" } },
];

export const chapterBySlug = (s: string) => CHAPTERS.find((c) => c.slug === s);
