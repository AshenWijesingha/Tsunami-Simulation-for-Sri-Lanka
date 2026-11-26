// Extracts accurate coastlines from Natural Earth (public domain) via the world-atlas package and
// writes src/lib/geo/coastlines.ts. Run after changing tolerances:
//   node scripts/geodata.mjs
// Also writes brand/mark.svg (logo source) and brand/sri-lanka.json (used by scripts/brand.mjs).
//
// - Sri Lanka: Natural Earth 1:10m "countries" (all islands: main island, Mannar, Delft, Jaffna
//   islands, Batticaloa barrier), Douglas–Peucker simplified to ~0.4 km.
// - Region land for the hero map: Natural Earth 1:50m "land", clipped to the box, simplified to ~9 km.
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const topo = require("topojson-client");
const countries = require("world-atlas/countries-10m.json");
const land50 = require("world-atlas/land-50m.json");

/** Douglas–Peucker for a closed ring: split at the vertex farthest from the start, simplify both halves. */
function simplify(ring, tol) {
  const pts = ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  if (pts.length < 4) return pts;
  let far = 0,
    best = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > best) {
      best = d;
      far = i;
    }
  }
  const a = simplifyLine(pts.slice(0, far + 1), tol),
    b = simplifyLine([...pts.slice(far), pts[0]], tol);
  return [...a, ...b.slice(1, -1)];
}

/** Douglas–Peucker on an open polyline of [lon, lat] (tolerance in degrees, longitude scaled by cos(lat)). */
function simplifyLine(pts, tol) {
  if (pts.length < 4) return pts;
  const k = Math.cos((pts[0][1] * Math.PI) / 180);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = [pts[a][0] * k, pts[a][1]],
      [bx, by] = [pts[b][0] * k, pts[b][1]];
    const dx = bx - ax,
      dy = by - ay,
      L = Math.hypot(dx, dy) || 1e-12;
    let maxD = -1,
      idx = -1;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] * k - ax,
        py = pts[i][1] - ay;
      const d = Math.abs(px * dy - py * dx) / L;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > tol) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
const r = (v) => Math.round(v * 1e4) / 1e4;

// ---------- Sri Lanka ----------
const lk = topo.feature(countries, countries.objects.countries).features.find((f) => f.properties.name === "Sri Lanka");
const lkPolys = lk.geometry.type === "Polygon" ? [lk.geometry.coordinates] : lk.geometry.coordinates;
const lkRings = lkPolys.map((p) => simplify(p[0], 0.0035).map(([x, y]) => [r(x), r(y)]));
const all = lkPolys.flatMap((p) => p[0]);
const bbox = {
  west: Math.min(...all.map((c) => c[0])),
  east: Math.max(...all.map((c) => c[0])),
  south: Math.min(...all.map((c) => c[1])),
  north: Math.max(...all.map((c) => c[1])),
};
// Full-resolution main-island ring, used by tests to check station positions.
const mainFull = lkPolys.reduce((a, p) => (p[0].length > a.length ? p[0] : a), []).map(([x, y]) => [r(x), r(y)]);

// ---------- regional land (hero map) ----------
const BOX = { west: 45, east: 110, south: -35, north: 32 };
const landFeat = topo.feature(land50, land50.objects.land);
const landGeoms = landFeat.features ? landFeat.features.map((f) => f.geometry) : [landFeat.geometry];
const landPolys = landGeoms.flatMap((g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates));
const region = [];
for (const p of landPolys) {
  const ring = p[0];
  const xs = ring.map((c) => c[0]),
    ys = ring.map((c) => c[1]);
  if (Math.max(...xs) < BOX.west - 2 || Math.min(...xs) > BOX.east + 2 || Math.max(...ys) < BOX.south - 2 || Math.min(...ys) > BOX.north + 2) continue;
  const s = simplify(ring, 0.08).map(([x, y]) => [r(x), r(y)]);
  if (s.length >= 3) region.push(s);
}

// ---------- logo mark ----------
// Equirectangular with cos(mid-latitude): equal ground distance per unit in x and y (Mercator differs
// by < 0.6 % over Sri Lanka's 3.9° of latitude). Island spans y 7 → 31 in the 64-unit tile.
const MID = ((bbox.north + bbox.south) / 2) * (Math.PI / 180);
const markScale = 24 / (bbox.north - bbox.south);
const MX0 = 41,
  MY0 = 7;
const markRings = lkPolys.map((p) => simplify(p[0], 0.012));
const markPath = markRings
  .map(
    (ring) =>
      ring
        .map(([lon, lat], i) => {
          const x = MX0 + (lon - bbox.west) * Math.cos(MID) * markScale,
            y = MY0 + (bbox.north - lat) * markScale;
          return (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
        })
        .join("") + "Z",
  )
  .join("");

const MARK_SVG = (path) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Indian Ocean Tsunami Lab">
  <title>Indian Ocean Tsunami Lab</title>
  <defs>
    <linearGradient id="iotl-ocean" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A2463"/>
      <stop offset=".55" stop-color="#0B5394"/>
      <stop offset="1" stop-color="#0EA5C6"/>
    </linearGradient>
    <clipPath id="iotl-tile"><rect width="64" height="64" rx="15"/></clipPath>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#iotl-ocean)"/>
  <!-- Sri Lanka: Natural Earth 1:10m coastline (all islands), true aspect ratio. Generated by scripts/geodata.mjs -->
  <path d="${path}" fill="#FFC94A" fill-rule="nonzero"/>
  <g clip-path="url(#iotl-tile)">
    <path d="M-2 64V41c9 0 14-13 27-15 10-1.5 17 5 15 11-1.5 4-7.5 5-9.5 1.5 3 1 5-1 4.5-3-1-3.5-6-4.5-9.5-1.5-6.5 5.5-4 16.5 5 19 8 2 15-4 24-4 4 0 7 1 11 2.5V64z" fill="#fff"/>
    <path d="M-2 64v-5.5c12-3 21 1 32 0 10-1 18-5 36-3V64z" fill="#9ADCF2"/>
  </g>
</svg>
`;
writeFileSync("brand/mark.svg", MARK_SVG(markPath));
writeFileSync("brand/sri-lanka.json", JSON.stringify({ bbox, rings: lkRings }));

mkdirSync("src/lib/geo", { recursive: true });
const out = `// Generated by scripts/geodata.mjs from Natural Earth (public domain) via world-atlas 2.0.2. Do not edit.
// Coordinates are [longitude, latitude] in degrees (WGS 84).

/** Sri Lanka, Natural Earth 1:10m, all islands, simplified to ~0.4 km. */
export const SRI_LANKA_RINGS: [number, number][][] = ${JSON.stringify(lkRings)};

/** Extent of the unsimplified 1:10m geometry. */
export const SRI_LANKA_BBOX = ${JSON.stringify(bbox)};

/** Unsimplified 1:10m main-island coastline (for validation). */
export const SRI_LANKA_MAIN_FULL: [number, number][] = ${JSON.stringify(mainFull)};

/** Sri Lanka simplified to ~2 km, for small-scale maps. */
export const SRI_LANKA_RINGS_MAP: [number, number][][] = ${JSON.stringify(lkPolys.map((p) => simplify(p[0], 0.018).map(([x, y]) => [r(x), r(y)])))};

/** Natural Earth 1:50m land within ${JSON.stringify(BOX)}, simplified to ~9 km. */
export const REGION_LAND: [number, number][][] = ${JSON.stringify(region)};
`;
writeFileSync("src/lib/geo/coastlines.ts", out);
writeFileSync(
  "src/lib/geo/mark.ts",
  `// Generated by scripts/geodata.mjs. Do not edit.
/** Sri Lanka in the 64 × 64 logo tile: Natural Earth 1:10m, all islands, true aspect ratio, ~1.3 km precision. */
export const MARK_ISLAND_PATH = ${JSON.stringify(markPath)};
`,
);
console.log(
  `mark: ${markRings.reduce((a, x) => a + x.length, 0)} pts; Sri Lanka: ${lkRings.length} rings, ${lkRings.reduce((a, x) => a + x.length, 0)} pts (bbox ${JSON.stringify(bbox)}); region land: ${region.length} polygons, ${region.reduce((a, x) => a + x.length, 0)} pts`,
);
