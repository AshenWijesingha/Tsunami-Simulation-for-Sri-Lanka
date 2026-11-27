import { DOM } from "./constants";
import { rad } from "./geo";
import { decodeMask, MASK_NX, MASK_NY } from "./mask";

export interface Bathymetry {
  nx: number;
  ny: number;
  /** Grid spacing (degrees). */
  d: number;
  /** Still-water depth (m), 0 on land. Row-major, j = latitude index from DOM.lat0. */
  h: Float32Array;
  src: string;
  live: boolean;
}

export const TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Decode a Terrarium-encoded RGBA tile to elevation (m). */
export function decodeTerrarium(rgba: Uint8ClampedArray, n = 65536): Float32Array {
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) e[i] = rgba[i * 4] * 256 + rgba[i * 4 + 1] + rgba[i * 4 + 2] / 256 - 32768;
  return e;
}

async function fetchTile(url: string, ms: number): Promise<Float32Array> {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, mode: "cors" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const bmp = await createImageBitmap(await r.blob());
    const c = new OffscreenCanvas(256, 256);
    const cx = c.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    cx.drawImage(bmp, 0, 0);
    return decodeTerrarium(cx.getImageData(0, 0, 256, 256).data);
  } finally {
    clearTimeout(to);
  }
}

/** Decoded tiles survive between runs (10′ → 5′, scenario changes) in this worker. */
const tileCache = new Map<string, Float32Array>();

async function liveTiles(onProg: (f: number) => void) {
  const z = 5,
    n = 32;
  const tiles: Record<string, Float32Array> = {};
  const x0 = Math.floor(((DOM.lon0 + 180) / 360) * n),
    x1 = Math.floor(((DOM.lon1 + 180) / 360) * n);
  const merc = (l: number) => Math.log(Math.tan(Math.PI / 4 + rad(l) / 2));
  const ty = (l: number) => Math.floor(((1 - merc(l) / Math.PI) / 2) * n);
  const y0 = ty(DOM.lat1),
    y1 = ty(DOM.lat0);
  let done = 0;
  const total = (x1 - x0 + 1) * (y1 - y0 + 1);
  const jobs: Promise<void>[] = [];
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++) {
      const url = TERRARIUM.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
      const hit = tileCache.get(url);
      if (hit) {
        tiles[x + "_" + y] = hit;
        onProg(++done / total);
        continue;
      }
      jobs.push(
        fetchTile(url, 12000).then((e) => {
          tileCache.set(url, e);
          tiles[x + "_" + y] = e;
          onProg(++done / total);
        }),
      );
    }
  // One overall budget: a slow or blocked tile server falls back to the idealised bathymetry
  // instead of keeping the user waiting.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const budget = new Promise<never>((_, rej) => (timer = setTimeout(() => rej(new Error("tile budget exceeded")), 20000)));
  try {
    await Promise.race([Promise.all(jobs), budget]);
  } finally {
    clearTimeout(timer);
  }
  return { tiles, n };
}

/** Fallback: real coastline mask with an idealised shelf / slope / abyssal depth profile. */
function fallback(nx: number, ny: number, d: number): Float32Array {
  const m10 = decodeMask();
  const h = new Float32Array(nx * ny);
  const land = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const i10 = Math.min(MASK_NX - 1, Math.round(i * d * 6)),
        j10 = Math.min(MASK_NY - 1, Math.round(j * d * 6));
      land[j * nx + i] = m10[j10 * MASK_NX + i10];
    }
  // Distance to coast in cells (8-neighbour BFS / Dijkstra-like relaxation).
  const dist = new Float32Array(nx * ny).fill(1e9);
  const q = new Int32Array(nx * ny * 4);
  let qh = 0,
    qt = 0;
  for (let k = 0; k < nx * ny; k++)
    if (land[k]) {
      dist[k] = 0;
      q[qt++] = k;
    }
  while (qh < qt) {
    const k = q[qh++],
      i = k % nx,
      j = (k / nx) | 0;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ii = i + di,
          jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const kk = jj * nx + ii,
          nd = dist[k] + (di && dj ? 1.414 : 1);
        if (nd < dist[kk] && qt < q.length) {
          dist[kk] = nd;
          q[qt++] = kk;
        }
      }
  }
  const cellKm = d * 111.19;
  for (let k = 0; k < nx * ny; k++) {
    if (land[k]) {
      h[k] = 0;
      continue;
    }
    const km = dist[k] * cellKm;
    h[k] = km < 40 ? 60 + km * 4 : km < 170 ? 220 + (km - 40) * (3900 / 130) : 4100 + Math.min(400, (km - 170) * 0.4);
  }
  return h;
}

/** Build model bathymetry at `res` arc-minutes. Tries live ETOPO1 Terrarium tiles first. */
export async function buildBathymetry(res: number, mode: "auto" | "fallback", onProg: (f: number) => void): Promise<Bathymetry> {
  const d = res / 60,
    nx = Math.round((DOM.lon1 - DOM.lon0) / d) + 1,
    ny = Math.round((DOM.lat1 - DOM.lat0) / d) + 1;
  if (mode === "auto" && typeof OffscreenCanvas !== "undefined") {
    try {
      const T = await liveTiles(onProg),
        W = 256 * T.n;
      const sample = (lat: number, lon: number) => {
        const px = ((lon + 180) / 360) * W,
          py = ((1 - Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2)) / Math.PI) / 2) * W;
        const tx = Math.floor(px / 256),
          ty = Math.floor(py / 256),
          t = T.tiles[tx + "_" + ty];
        if (!t) return NaN;
        const ix = Math.min(255, Math.floor(px - tx * 256)),
          iy = Math.min(255, Math.floor(py - ty * 256));
        return t[iy * 256 + ix];
      };
      const h = new Float32Array(nx * ny);
      const sub = 3;
      for (let j = 0; j < ny; j++) {
        const lat = DOM.lat0 + j * d;
        for (let i = 0; i < nx; i++) {
          const lon = DOM.lon0 + i * d;
          let s = 0,
            c = 0,
            wet = 0;
          for (let a = 0; a < sub; a++)
            for (let b = 0; b < sub; b++) {
              const e = sample(lat + ((a - (sub - 1) / 2) * d) / sub, lon + ((b - (sub - 1) / 2) * d) / sub);
              if (Number.isFinite(e)) {
                s += e;
                c++;
                if (e < 0) wet++;
              }
            }
          const mean = c ? s / c : 1;
          h[j * nx + i] = wet * 2 > c && mean < -10 ? Math.max(-mean, 20) : 0;
        }
      }
      return { nx, ny, d, h, src: "ETOPO1 (Terrarium tiles, live)", live: true };
    } catch {
      /* fall through */
    }
  }
  return {
    nx,
    ny,
    d,
    h: fallback(nx, ny, d),
    src: "Idealised fallback (real coastline mask, synthetic shelf/slope/abyssal profile)",
    live: false,
  };
}
