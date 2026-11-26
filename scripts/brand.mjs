// Renders every brand asset from brand/*.svg with headless Chromium (Playwright).
//   NODE_PATH=$(npm root -g) node scripts/brand.mjs
// Outputs (committed):
//   public/favicon.ico             16, 32, 48 px (PNG-in-ICO)
//   public/icon.svg                scalable favicon for modern browsers
//   public/apple-touch-icon.png    180 px, full-bleed for iOS masks
// Icon <link> tags are declared in src/app/layout.tsx (explicit, base-path aware).
//   public/icons/icon-192.png, icon-512.png, maskable-512.png   PWA / manifest
//   public/brand/logo.svg, logo-mark.svg, logo-lockup.png       press kit
//   public/og/<section>.jpg        1200 × 630 social preview images
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
// Playwright is a dev tool, not a project dependency: run with NODE_PATH pointing at a global install,
//   NODE_PATH=$(npm root -g) node scripts/brand.mjs
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const P = (...p) => path.join(root, ...p);
const mark = readFileSync(P("brand/mark.svg"), "utf8");
// Fonts are embedded as data URLs: pages rendered from setContent cannot load file:// URLs.
const font = (pkg, file) => "data:font/woff2;base64," + readFileSync(P("node_modules", pkg, "files", file)).toString("base64");
const FONTS = `
@font-face{font-family:Inter;src:url(${font("@fontsource-variable/inter", "inter-latin-wght-normal.woff2")}) format("woff2");font-weight:100 900}
@font-face{font-family:"Source Serif";src:url(${font("@fontsource-variable/source-serif-4", "source-serif-4-latin-wght-normal.woff2")}) format("woff2");font-weight:200 900}`;

for (const d of ["public/icons", "public/brand", "public/og"]) mkdirSync(P(d), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function png(html, w, h, transparent = true, type = "png") {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>${FONTS}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  return page.screenshot(type === "jpeg" ? { type, quality: 86 } : { omitBackground: transparent, type });
}
const svgBox = (svg, size, pad = 0, bg = "transparent") =>
  `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg}"><div style="width:${size - 2 * pad}px;height:${size - 2 * pad}px">${svg.replace("<svg ", `<svg width="100%" height="100%" `)}</div></div>`;

// ---------- icons ----------
const ico = [];
for (const s of [16, 32, 48]) ico.push({ s, data: await png(svgBox(mark, s), s, s) });
// ICO container with embedded PNGs
const header = Buffer.alloc(6 + 16 * ico.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(ico.length, 4);
let offset = header.length;
ico.forEach(({ s, data }, i) => {
  const o = 6 + 16 * i;
  header.writeUInt8(s, o);
  header.writeUInt8(s, o + 1);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(data.length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += data.length;
});
writeFileSync(P("public/favicon.ico"), Buffer.concat([header, ...ico.map((x) => x.data)]));
writeFileSync(P("public/icon.svg"), mark);

// Full-bleed square (no rounded corners) for platforms that apply their own mask.
const square = mark.replace(/rx="15"/g, 'rx="0"');
writeFileSync(P("public/apple-touch-icon.png"), await png(svgBox(square, 180), 180, 180, false));
writeFileSync(P("public/icons/icon-192.png"), await png(svgBox(mark, 192), 192, 192));
writeFileSync(P("public/icons/icon-512.png"), await png(svgBox(mark, 512), 512, 512));
// Maskable: artwork inside the 80 % safe zone on a solid brand background.
writeFileSync(P("public/icons/maskable-512.png"), await png(svgBox(square, 512, 52, "#0A2463"), 512, 512, false));

// ---------- logo files ----------
copyFileSync(P("brand/mark.svg"), P("public/brand/logo-mark.svg"));
const lockupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 96" role="img" aria-label="Indian Ocean Tsunami Lab">
  <g transform="translate(8 8) scale(1.25)">${mark.replace(/<\?xml[^>]*>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "")}</g>
  <text x="104" y="52" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="34" font-weight="800" fill="#0A2463" letter-spacing="-0.5">Tsunami Lab</text>
  <text x="105" y="76" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="13" font-weight="700" fill="#0B5394" letter-spacing="2.4">INDIAN OCEAN · SRI LANKA</text>
</svg>`;
writeFileSync(P("public/brand/logo.svg"), lockupSvg);
writeFileSync(P("public/brand/logo-lockup.png"), await png(`<div style="padding:24px;background:#fff;width:840px">${lockupSvg.replace("<svg ", '<svg width="840" ')}</div>`, 888, 240, false));

// ---------- social preview images ----------
const SECTIONS = {
  home: ["Open research platform", "How dangerous is a distant earthquake to Sri Lanka's coast?", "Shallow-water simulation · uncertainty · impact"],
  simulator: ["Numerical simulator", "Run an Indian Ocean tsunami model in your browser", "Actual M6.5 event · what-if sources · 2004 validation"],
  learn: ["12-chapter course", "Far-field tsunami hazard, from the bulletin to the physics", "Source scaling · shallow-water equations · dispersion · shoaling"],
  analysis: ["Uncertainty analysis", "Sensitivity, dispersion and a reproducible Monte Carlo", "Every figure exports as SVG, PNG and CSV"],
  impact: ["Impact & vulnerability", "From wave height to human impact", "The 2004 record · vulnerability research · fragility explorer"],
  methods: ["Methods & model card", "Equations, numerics, verification and limitations", "Documented for review and reproducibility"],
  exercises: ["Exercises", "Think like a tsunami forecaster", "Quiz · predict & verify · the operational decision"],
  references: ["References & data", "Sources, DOIs, data licences and citation", "Open science, citable and reusable"],
};
const rings = Array.from({ length: 9 }, (_, i) => {
  const r = 140 + i * 105;
  return `<circle cx="760" cy="700" r="${r}" fill="none" stroke="white" stroke-opacity="${(0.16 - i * 0.014).toFixed(3)}" stroke-width="3"/>`;
}).join("");
for (const [key, [eyebrow, title, sub]] of Object.entries(SECTIONS)) {
  const html = `
  <div style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:Inter;color:#fff;
      background:radial-gradient(900px 600px at 85% 100%, #0EA5C6 0%, transparent 60%), linear-gradient(135deg,#071a47 0%,#0A2463 45%,#0B5394 100%)">
    <svg width="1200" height="630" style="position:absolute;inset:0">${rings}
      <g transform="translate(560 -30) scale(10)"><path d="M43.2 7.1L41 8l1 1.4-1.1 2.8-1.3 4.8.6 3.7.4 4 2.4 5.5 2.8.7 3.6-1.2 2.8-1.7 2.3-2.7-.9-5.4-3.3-5.2-2.9-4.2-2.6-1.4z" fill="#FFC94A" stroke="#FFC94A" stroke-width="1.2" stroke-linejoin="round" opacity=".95"/></g>
    </svg>
    <div style="position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:18px">
      <div style="width:64px;height:64px">${mark.replace("<svg ", '<svg width="64" height="64" ')}</div>
      <div><div style="font-weight:800;font-size:30px;letter-spacing:-.4px">Tsunami Lab</div>
      <div style="font-weight:700;font-size:13px;letter-spacing:2.6px;color:#9ad7f0">INDIAN OCEAN · SRI LANKA</div></div>
    </div>
    <div style="position:absolute;left:72px;top:212px;width:840px">
      <div style="font-weight:700;font-size:20px;letter-spacing:3px;text-transform:uppercase;color:#FFC94A">${eyebrow}</div>
      <div style="font-family:'Source Serif';font-weight:650;font-size:60px;line-height:1.08;margin-top:14px;letter-spacing:-.5px">${title}</div>
      <div style="font-size:24px;margin-top:22px;color:#cfe6f5">${sub}</div>
    </div>
  </div>`;
  writeFileSync(P(`public/og/${key}.jpg`), await png(html, 1200, 630, false, "jpeg"));
}

await browser.close();
console.log("brand assets written");
