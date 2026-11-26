import type { ReactNode } from "react";

export interface Series {
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  color: string;
  w?: number;
  dash?: string;
  label?: string;
}
export interface Pt {
  x: number;
  y: number;
  color: string;
  fill?: boolean;
  r?: number;
  label?: string;
  title?: string;
}
export interface Bar {
  x0: number;
  x1: number;
  y: number;
  color: string;
}
export interface RefLine {
  v: number;
  color: string;
  label?: string;
}
export interface LegendItem {
  label: string;
  color: string;
  kind?: "line" | "dot" | "ring" | "dash";
}

export interface ChartProps {
  xlim: [number, number];
  ylim: [number, number];
  logx?: boolean;
  logy?: boolean;
  xlabel?: string;
  ylabel?: string;
  series?: Series[];
  points?: Pt[];
  bars?: Bar[];
  hlines?: RefLine[];
  vlines?: RefLine[];
  bands?: { y0: number; y1: number; color: string; label?: string }[];
  legend?: LegendItem[];
  legendPos?: "tl" | "tr" | "bl" | "br";
  fx?: (v: number) => string;
  fy?: (v: number) => string;
  width?: number;
  height?: number;
  title?: string;
  desc?: string;
  id?: string;
  children?: ReactNode;
}

function ticks(a: number, b: number, log: boolean): number[] {
  const t: number[] = [];
  if (log) {
    for (let e = Math.floor(a); e <= Math.ceil(b); e++) if (e >= a - 1e-9 && e <= b + 1e-9) t.push(Math.pow(10, e));
    return t;
  }
  const span = b - a;
  if (!(span > 0)) return [a];
  const st = Math.pow(10, Math.floor(Math.log10(span / 5)));
  const m = ([1, 2, 5, 10].find((m) => span / (st * m) <= 7) ?? 10) * st;
  for (let v = Math.ceil(a / m) * m; v <= b + 1e-9; v += m) t.push(+v.toFixed(10));
  return t;
}

export const defaultLogFmt = (v: number) => (v >= 1 ? (v >= 1000 ? `${v / 1000}k` : String(v)) : v.toExponential(0).replace("e-", "e−"));

/**
 * Lightweight, dependency-free SVG chart. Colours accept CSS variables so charts follow the theme.
 * Renders identically on the server and the client.
 */
export function Chart(o: ChartProps) {
  const W = o.width ?? 720,
    H = o.height ?? 420;
  const fs = 12.5;
  const pad = { l: 62, r: 14, t: 14, b: 48 };
  const pw = W - pad.l - pad.r,
    ph = H - pad.t - pad.b;
  const tx = o.logx ? (v: number) => Math.log10(v) : (v: number) => v;
  const ty = o.logy ? (v: number) => Math.log10(v) : (v: number) => v;
  const x0 = tx(o.xlim[0]),
    x1 = tx(o.xlim[1]),
    y0 = ty(o.ylim[0]),
    y1 = ty(o.ylim[1]);
  const X = (v: number) => pad.l + ((tx(v) - x0) / (x1 - x0)) * pw;
  const Y = (v: number) => pad.t + ph - ((ty(v) - y0) / (y1 - y0)) * ph;
  const fx = o.fx ?? (o.logx ? defaultLogFmt : (v: number) => String(v));
  const fy = o.fy ?? (o.logy ? defaultLogFmt : (v: number) => String(v));
  const ok = (x: number, y: number) =>
    Number.isFinite(x) && Number.isFinite(y) && !(o.logx && x <= 0) && !(o.logy && y <= 0);
  const path = (s: Series) => {
    let d = "",
      pen = false;
    const n = Math.min(s.x.length, s.y.length);
    for (let i = 0; i < n; i++) {
      const xv = s.x[i],
        yv = s.y[i];
      if (!ok(xv, yv)) {
        pen = false;
        continue;
      }
      d += (pen ? "L" : "M") + X(xv).toFixed(1) + " " + Y(yv).toFixed(1);
      pen = true;
    }
    return d;
  };
  const clipId = `clip-${o.id ?? "c"}`;
  const xt = ticks(x0, x1, !!o.logx),
    yt = ticks(y0, y1, !!o.logy);

  const lg = o.legend ?? [];
  const lw = lg.length ? Math.max(...lg.map((l) => l.label.length)) * fs * 0.56 + 38 : 0;
  const lh = fs * 1.45;
  const pos = o.legendPos ?? "tr";
  const lx = pos.endsWith("l") ? pad.l + 8 : pad.l + pw - lw - 8;
  const ly = pos.startsWith("t") ? pad.t + 8 : pad.t + ph - lh * lg.length - 16;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={o.title ?? o.ylabel}
      id={o.id}
      style={{ display: "block", fontFamily: "var(--font-sans)", height: "auto" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {o.title && <title>{o.title}</title>}
      {o.desc && <desc>{o.desc}</desc>}
      <rect x={0} y={0} width={W} height={H} fill="var(--chart-bg)" rx={10} />
      <defs>
        <clipPath id={clipId}>
          <rect x={pad.l} y={pad.t} width={pw} height={ph} />
        </clipPath>
      </defs>
      <g fontSize={fs} fill="var(--muted)">
        {xt.map((v) => (
          <g key={"x" + v}>
            <line x1={X(v)} x2={X(v)} y1={pad.t} y2={pad.t + ph} stroke="var(--chart-grid)" />
            <text x={X(v)} y={pad.t + ph + fs * 1.45} textAnchor="middle">
              {fx(v)}
            </text>
          </g>
        ))}
        {yt.map((v) => (
          <g key={"y" + v}>
            <line x1={pad.l} x2={pad.l + pw} y1={Y(v)} y2={Y(v)} stroke="var(--chart-grid)" />
            <text x={pad.l - 7} y={Y(v) + fs * 0.35} textAnchor="end">
              {fy(v)}
            </text>
          </g>
        ))}
      </g>
      <rect x={pad.l} y={pad.t} width={pw} height={ph} fill="none" stroke="var(--chart-axis)" />
      <text x={pad.l + pw / 2} y={H - 10} textAnchor="middle" fontSize={fs * 1.04} fill="var(--text-2)">
        {o.xlabel}
      </text>
      <text transform={`translate(${fs * 1.2},${pad.t + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={fs * 1.04} fill="var(--text-2)">
        {o.ylabel}
      </text>
      <g clipPath={`url(#${clipId})`}>
        {(o.bands ?? []).map((b, i) => (
          <rect key={"bd" + i} x={pad.l} width={pw} y={Y(b.y1)} height={Math.max(0, Y(b.y0) - Y(b.y1))} fill={b.color} opacity={0.12} />
        ))}
        {(o.bars ?? []).map((b, i) => (
          <rect
            key={"b" + i}
            x={X(b.x0)}
            y={Y(b.y)}
            width={Math.max(1, X(b.x1) - X(b.x0) - 1)}
            height={Math.max(0, Y(o.ylim[0]) - Y(b.y))}
            fill={b.color}
            opacity={0.85}
          />
        ))}
        {(o.hlines ?? []).map((h, i) => (
          <g key={"h" + i}>
            <line x1={pad.l} x2={pad.l + pw} y1={Y(h.v)} y2={Y(h.v)} stroke={h.color} strokeDasharray="7 5" strokeWidth={1.3} />
            {h.label && (
              <text x={pad.l + pw - 6} y={Y(h.v) - 4} textAnchor="end" fontSize={fs * 0.9} fill={h.color}>
                {h.label}
              </text>
            )}
          </g>
        ))}
        {(o.vlines ?? []).map((h, i) => (
          <g key={"v" + i}>
            <line x1={X(h.v)} x2={X(h.v)} y1={pad.t} y2={pad.t + ph} stroke={h.color} strokeDasharray="5 4" strokeWidth={1.3} />
            {h.label && (
              <text x={X(h.v) + 4} y={pad.t + ph - 6} fontSize={fs * 0.9} fill={h.color}>
                {h.label}
              </text>
            )}
          </g>
        ))}
        {(o.series ?? []).map((s, i) => (
          <path key={"s" + i} d={path(s)} fill="none" stroke={s.color} strokeWidth={s.w ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" />
        ))}
        {(o.points ?? []).map((p, i) =>
          ok(p.x, p.y) ? (
            <g key={"p" + i}>
              <circle
                cx={X(p.x)}
                cy={Y(p.y)}
                r={(p.r ?? 5) * 0.85}
                fill={p.fill ? p.color : "var(--chart-bg)"}
                stroke={p.color}
                strokeWidth={1.6}
              >
                {p.title && <title>{p.title}</title>}
              </circle>
              {p.label && (
                <text x={X(p.x) + 8} y={Y(p.y) - 7} fontSize={fs * 0.9} fill="var(--text)">
                  {p.label}
                </text>
              )}
            </g>
          ) : null,
        )}
        {o.children}
      </g>
      {lg.length > 0 && (
        <g>
          <rect x={lx} y={ly} width={lw} height={lh * lg.length + 10} rx={6} fill="var(--chart-bg)" fillOpacity={0.9} stroke="var(--chart-grid)" />
          {lg.map((l, i) => {
            const yy = ly + 5 + lh * i + lh / 2;
            return (
              <g key={"l" + i}>
                {l.kind === "dot" || l.kind === "ring" ? (
                  <circle cx={lx + 17} cy={yy} r={4.5} fill={l.kind === "dot" ? l.color : "none"} stroke={l.color} strokeWidth={1.6} />
                ) : (
                  <line x1={lx + 8} x2={lx + 26} y1={yy} y2={yy} stroke={l.color} strokeWidth={3} strokeDasharray={l.kind === "dash" ? "5 3" : undefined} />
                )}
                <text x={lx + 33} y={yy + fs * 0.33} fontSize={fs * 0.92} fill="var(--text)">
                  {l.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export const C = {
  s1: "var(--s1)",
  s2: "var(--s2)",
  s3: "var(--s3)",
  s4: "var(--s4)",
  s5: "var(--s5)",
  s6: "var(--s6)",
  muted: "var(--muted)",
  text: "var(--text)",
  warn: "#f6c343",
  orange: "#f08a24",
  bad: "#e5484d",
};
export const PALETTE = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "#8ecae6", "#90be6d", "#f72585", "#e9c46a"];
