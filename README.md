# Indian Ocean Tsunami Lab

**Open, reproducible far-field tsunami hazard research and teaching for Sri Lanka.**

A Next.js web application that grew out of a single-file lecture tool about the M6.5 Mauritius–Réunion region earthquake of 24 November 2026 (Department of Meteorology Bulletin No. 02: *no tsunami threat*). It pairs a browser-based numerical shallow-water model with empirical forecasts, uncertainty analysis, a validation against the 2004 Indian Ocean tsunami, and a review of the evidence on coastal impact.

> Research and teaching platform only. Not an operational warning service. In Sri Lanka, follow the Department of Meteorology and the Disaster Management Centre (hotline 117).

## What's inside

| Route | Content |
| --- | --- |
| `/` | Overview of the case study and headline results |
| `/simulator` | Linear shallow-water model (spherical C-grid, forward–backward, CFL 0.85) running in a Web Worker; three scenarios (actual M6.5, hypothetical with presets, 2004 validation); η, ηmax, travel-time and bathymetry layers; 21 Sri Lankan and 8 regional synthetic gauges; coastal elevation overlays; run history for convergence studies; shareable permalinks; CSV/JSON/ESRI ASCII export |
| `/learn` | 12-chapter course with KaTeX equations, server-rendered figures and live model values; each chapter can set up the simulator |
| `/analysis` | Amplitude decay, travel time, dispersion, magnitude–mechanism sensitivity, and a seeded, configurable Monte Carlo; every figure exports as SVG/PNG/CSV |
| `/impact` | The 2004 record in Sri Lanka (with sources and ranges), vulnerability research, warning and policy since 2004, source zones, a fragility-based impact explorer, and open research questions |
| `/methods` | Model card: equations, numerics, source model, verification tests, validation, limitations, reproducibility |
| `/exercises` | Concept quiz, predict and verify, the operational decision at t + 65 min, forecaster challenge |
| `/references` | Bibliography with DOIs, data and software licences, BibTeX |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # physics verification suite (vitest)
npm run build      # production build
```

Requires Node.js 20+. Live ETOPO1 bathymetry, basemaps and DEM elevations are fetched from open public tile services at runtime; without network access the model falls back to an idealised bathymetry built from a real coastline mask.

## Code layout

```
src/lib/physics/   Pure TypeScript physics (no DOM): constants, geometry, source scaling,
                   bathymetry, solver, simulation driver, stations, empirical relations, Monte Carlo
src/workers/       Web Worker that runs the solver off the main thread
src/lib/sim/       Client store (zustand), field rendering, derived results
src/components/    Simulator, charts (dependency-free SVG), analysis, impact, exercises, UI
src/content/       Course text, chapter metadata, equations, references
src/app/           Next.js App Router pages
tests/             Physics verification tests
```

## Citation

See `/references#cite` in the app for BibTeX. Please cite the version, and describe scenarios by their permalink and exported run metadata.
