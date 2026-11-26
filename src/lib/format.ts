/** Format a length in metres with an adaptive unit (mm / cm / m). */
export function fmtLen(m: number): string {
  if (!Number.isFinite(m)) return "—";
  const a = Math.abs(m);
  if (a < 1e-3) return (m * 1000).toFixed(a < 1e-4 ? 3 : 2) + " mm";
  if (a < 0.01) return (m * 1000).toFixed(1) + " mm";
  if (a < 1) return (m * 100).toFixed(1) + " cm";
  return m.toFixed(2) + " m";
}

/** Format a duration in minutes as "H h MM min". */
export function fmtDur(min: number): string {
  if (!Number.isFinite(min)) return "—";
  const tot = Math.round(min),
    h = Math.floor(tot / 60),
    m = tot - h * 60;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

/** Wrap minutes-of-day into [0, 1440). */
export const wrapDay = (m: number) => ((m % 1440) + 1440) % 1440;

export function clockString(baseMin: number, tMin: number, tz: string, seconds = false) {
  const tc = wrapDay(baseMin + tMin);
  const hh = Math.floor(tc / 60),
    mm = Math.floor(tc % 60),
    ss = Math.floor((tc * 60) % 60);
  return (
    String(hh).padStart(2, "0") +
    ":" +
    String(mm).padStart(2, "0") +
    (seconds ? ":" + String(ss).padStart(2, "0") : "") +
    " " +
    tz
  );
}

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

export function fmtSci(x: number, dp = 2) {
  if (!Number.isFinite(x)) return "—";
  const [m, e] = x.toExponential(dp).split("e");
  return `${m} × 10${superscript(+e)}`;
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
export function superscript(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[c] ?? c)
    .join("");
}

export function download(name: string, text: string | Blob, type = "text/plain") {
  const blob = text instanceof Blob ? text : new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
