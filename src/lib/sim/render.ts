import { DOM } from "@/lib/physics/constants";
import { deg, mercY } from "@/lib/physics/geo";
import type { RunData } from "@/lib/physics/simulate";
import { fmtLen } from "@/lib/format";
import type { Layer } from "./store";

let rowMap: Int32Array | null = null;
let rowKey = "";

/** Map output rows (Web-Mercator spaced) to model rows (equirectangular). */
function ensureRowMap(ny: number, d: number) {
  const key = ny + "_" + d;
  if (rowKey === key && rowMap) return rowMap;
  const H = Math.round(ny * 1.08),
    top = mercY(DOM.lat1),
    bot = mercY(DOM.lat0);
  rowMap = new Int32Array(H);
  for (let y = 0; y < H; y++) {
    const m = top - ((y + 0.5) * (top - bot)) / H,
      lat = deg(Math.atan(Math.sinh(m)));
    rowMap[y] = Math.max(0, Math.min(ny - 1, Math.round((lat - DOM.lat0) / d)));
  }
  rowKey = key;
  return rowMap;
}

function divColor(v: number, o: Uint8ClampedArray, idx: number) {
  const a = Math.min(1, Math.abs(v));
  if (a < 0.02) {
    o[idx + 3] = 0;
    return;
  }
  let r, gg, b;
  if (v > 0) {
    r = 255;
    gg = Math.round(255 * (1 - a * 0.75));
    b = Math.round(255 * (1 - a));
  } else {
    r = Math.round(255 * (1 - a));
    gg = Math.round(255 * (1 - a * 0.45));
    b = 255;
  }
  o[idx] = r;
  o[idx + 1] = gg;
  o[idx + 2] = b;
  o[idx + 3] = Math.round(255 * Math.min(1, 0.05 + Math.pow(a, 0.6)));
}

const MAGMA = [
  [13, 8, 135],
  [126, 3, 168],
  [204, 71, 120],
  [248, 149, 64],
  [240, 249, 33],
];
function seqColor(f: number, o: Uint8ClampedArray, idx: number, alpha: number) {
  f = Math.max(0, Math.min(1, f));
  const p = f * (MAGMA.length - 1),
    i = Math.min(MAGMA.length - 2, Math.floor(p)),
    t = p - i,
    a = MAGMA[i],
    b = MAGMA[i + 1];
  o[idx] = a[0] + (b[0] - a[0]) * t;
  o[idx + 1] = a[1] + (b[1] - a[1]) * t;
  o[idx + 2] = a[2] + (b[2] - a[2]) * t;
  o[idx + 3] = alpha;
}
function bathyColor(f: number, o: Uint8ClampedArray, idx: number) {
  o[idx] = 200 - 180 * f;
  o[idx + 1] = 230 - 170 * f;
  o[idx + 2] = 255 - 120 * f;
  o[idx + 3] = 200;
}

export function renderField(canvas: HTMLCanvasElement, run: RunData | null, eta: Float32Array | null, layer: Layer, scaleMul: number) {
  if (!run) return;
  const { nx, ny, d, h } = run.bathy;
  const rm = ensureRowMap(ny, d);
  const W = nx,
    H = rm.length;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d")!;
  if (layer === "off") {
    ctx.clearRect(0, 0, W, H);
    return;
  }
  const img = ctx.createImageData(W, H),
    o = img.data;
  const sc = run.scale * scaleMul;
  const mx = run.etaMax,
    arr = run.arr;
  const lmax = Math.log10(sc * 4),
    lmin = lmax - 3;
  for (let y = 0; y < H; y++) {
    const j = rm[y],
      base = j * nx;
    for (let i = 0; i < W; i++) {
      const k = base + i,
        idx = (y * W + i) * 4;
      if (h[k] <= 0) {
        o[idx + 3] = 0;
        continue;
      }
      if (layer === "eta") divColor((eta ? eta[k] : 0) / sc, o, idx);
      else if (layer === "max") {
        const v = mx[k];
        if (v <= 0) {
          o[idx + 3] = 0;
          continue;
        }
        const f = (Math.log10(v) - lmin) / (lmax - lmin);
        if (f < 0) {
          o[idx + 3] = 0;
          continue;
        }
        seqColor(f, o, idx, 210);
      } else if (layer === "tt") {
        const t = arr[k];
        if (t !== t) {
          o[idx + 3] = 0;
          continue;
        }
        const band = Math.floor(t / 60);
        const iso = (i > 0 && Math.floor(arr[k - 1] / 60) !== band) || (j > 0 && Math.floor(arr[k - nx] / 60) !== band);
        if (iso) {
          o[idx] = o[idx + 1] = o[idx + 2] = 255;
          o[idx + 3] = 230;
          continue;
        }
        seqColor(t / run.params.dur, o, idx, 170);
      } else if (layer === "bathy") bathyColor(Math.min(1, h[k] / 6500), o, idx);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function colorbarGradient(layer: Layer): string {
  if (layer === "eta") return "linear-gradient(90deg,#0000ff,#7fb6ff 35%,transparent 50%,#ffb27f 65%,#ff0000)";
  if (layer === "bathy") return "linear-gradient(90deg,rgb(200,230,255),rgb(20,60,135))";
  return "linear-gradient(90deg,rgb(13,8,135),rgb(126,3,168),rgb(204,71,120),rgb(248,149,64),rgb(240,249,33))";
}

export function colorbarInfo(layer: Layer, run: RunData | null, scaleMul: number) {
  const sc = run ? run.scale * scaleMul : 1;
  const dur = run ? run.params.dur : 420;
  switch (layer) {
    case "eta":
      return { title: "Sea-surface elevation η (linear)", lo: "−" + fmtLen(sc), mid: "0", hi: "+" + fmtLen(sc) };
    case "max":
      return { title: "Maximum elevation ηmax (log₁₀)", lo: fmtLen((sc * 4) / 1000), mid: fmtLen((sc * 4) / 31.6), hi: "≥ " + fmtLen(sc * 4) };
    case "tt":
      return { title: "Travel time (white = hourly isochrones)", lo: "0 h", mid: (dur / 120).toFixed(1) + " h", hi: dur / 60 + " h" };
    case "bathy":
      return { title: "Model bathymetry h", lo: "0 m", mid: "3,250 m", hi: "6,500 m" };
    default:
      return null;
  }
}
