// Renders every brand asset from brand/*.svg with headless Chromium (Playwright).
//   NODE_PATH=$(npm root -g) node scripts/brand.mjs
// Outputs (committed):
//   public/favicon.ico             16, 32, 48 px (PNG-in-ICO)
//   public/icon.svg                scalable favicon for modern browsers
//   public/apple-touch-icon.png    180 px, full-bleed for iOS masks
// Icon <link> tags are declared in src/components/site/RootShell.tsx (explicit, base-path aware).
//   public/icons/icon-192.png, icon-512.png, maskable-512.png   PWA / manifest
//   public/brand/logo.svg, logo-mark.svg, logo-lockup.png       press kit
//   public/og/<section>.jpg        1200 × 630 social preview images (English)
//   public/og/{si,ta}/<section>.jpg  the same in Sinhala and Tamil
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
@font-face{font-family:"Source Serif";src:url(${font("@fontsource-variable/source-serif-4", "source-serif-4-latin-wght-normal.woff2")}) format("woff2");font-weight:200 900}
@font-face{font-family:"Noto Sans Sinhala";src:url(${font("@fontsource-variable/noto-sans-sinhala", "noto-sans-sinhala-sinhala-wght-normal.woff2")}) format("woff2");font-weight:100 900}
@font-face{font-family:"Noto Serif Sinhala";src:url(${font("@fontsource-variable/noto-serif-sinhala", "noto-serif-sinhala-sinhala-wght-normal.woff2")}) format("woff2");font-weight:100 900}
@font-face{font-family:"Noto Sans Tamil";src:url(${font("@fontsource-variable/noto-sans-tamil", "noto-sans-tamil-tamil-wght-normal.woff2")}) format("woff2");font-weight:100 900}
@font-face{font-family:"Noto Serif Tamil";src:url(${font("@fontsource-variable/noto-serif-tamil", "noto-serif-tamil-tamil-wght-normal.woff2")}) format("woff2");font-weight:100 900}`;

for (const d of ["public/icons", "public/brand", "public/og", "public/og/si", "public/og/ta"]) mkdirSync(P(d), { recursive: true });

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
  en: {
    tagline: "INDIAN OCEAN · SRI LANKA",
    home: ["Open research platform", "How dangerous is a distant earthquake to Sri Lanka's coast?", "Shallow-water simulation · uncertainty · impact"],
    simulator: ["Numerical simulator", "Run an Indian Ocean tsunami model in your browser", "Actual M6.5 event · what-if sources · 2004 validation"],
    learn: ["12-chapter course", "Far-field tsunami hazard, from the bulletin to the physics", "Source scaling · shallow-water equations · dispersion · shoaling"],
    analysis: ["Uncertainty analysis", "Sensitivity, dispersion and a reproducible Monte Carlo", "Every figure exports as SVG, PNG and CSV"],
    impact: ["Impact & vulnerability", "From wave height to human impact", "The 2004 record · vulnerability research · fragility explorer"],
    methods: ["Methods & model card", "Equations, numerics, verification and limitations", "Documented for review and reproducibility"],
    exercises: ["Exercises", "Think like a tsunami forecaster", "Quiz · predict & verify · the operational decision"],
    references: ["References & data", "Sources, DOIs, data licences and citation", "Open science, citable and reusable"],
  },
  si: {
    tagline: "ඉන්දියන් සාගරය · ශ්‍රී ලංකාව",
    home: ["විවෘත පර්යේෂණ වේදිකාව", "දුරස්ථ භූමිකම්පාවක් ශ්‍රී ලංකාවේ වෙරළට කොතරම් අනතුරුදායකද?", "නොගැඹුරු ජල අනුකරණය · අවිනිශ්චිතතාව · බලපෑම"],
    simulator: ["සංඛ්‍යාත්මක අනුකාරකය", "ඔබේ බ්‍රවුසරයේම ඉන්දියන් සාගර සුනාමි ආකෘතියක් ධාවනය කරන්න", "සැබෑ M6.5 සිදුවීම · උපකල්පිත ප්‍රභව · 2004 සත්‍යාපනය"],
    learn: ["පරිච්ඡේද 12ක පාඨමාලාව", "දුරස්ථ සුනාමි අවදානම: නිවේදනයේ සිට භෞතික විද්‍යාව දක්වා", "ප්‍රභව පරිමාණය · නොගැඹුරු ජල සමීකරණ · විසරණය"],
    analysis: ["අවිනිශ්චිතතා විශ්ලේෂණය", "සංවේදීතාව, විසරණය සහ ප්‍රතිනිෂ්පාදනය කළ හැකි මොන්ටේ කාලෝ", "සෑම රූපයක්ම SVG, PNG සහ CSV ලෙස අපනයනය කළ හැක"],
    impact: ["බලපෑම සහ අවදානම", "තරංග උසේ සිට මානව බලපෑම දක්වා", "2004 වාර්තාව · අවදානම් පර්යේෂණ · හානි සම්භාවිතා ගවේෂකය"],
    methods: ["ක්‍රම සහ ආකෘති කාඩ්පත", "සමීකරණ, සංඛ්‍යාත්මක ක්‍රම, සත්‍යාපනය සහ සීමා", "සමාලෝචනය සහ ප්‍රතිනිෂ්පාදනය සඳහා ලේඛනගත කර ඇත"],
    exercises: ["අභ්‍යාස", "සුනාමි පුරෝකථනකරුවෙකු ලෙස සිතන්න", "ප්‍රශ්නාවලිය · අනාවැකිය සහ සත්‍යාපනය · මෙහෙයුම් තීරණය"],
    references: ["මූලාශ්‍ර සහ දත්ත", "මූලාශ්‍ර, DOI, දත්ත බලපත්‍ර සහ උපුටා දැක්වීම", "විවෘත විද්‍යාව: උපුටා දැක්විය හැකි, නැවත භාවිත කළ හැකි"],
  },
  ta: {
    tagline: "இந்தியப் பெருங்கடல் · இலங்கை",
    home: ["திறந்த ஆய்வுத் தளம்", "தொலைதூர நிலநடுக்கம் இலங்கைக் கரைக்கு எவ்வளவு ஆபத்தானது?", "ஆழமற்ற நீர் உருவகப்படுத்தல் · நிச்சயமின்மை · தாக்கம்"],
    simulator: ["எண்ணியல் உருவகப்படுத்தி", "உங்கள் உலாவியிலேயே இந்தியப் பெருங்கடல் சுனாமி மாதிரியை இயக்குங்கள்", "உண்மையான M6.5 நிகழ்வு · கற்பனை மூலங்கள் · 2004 சரிபார்ப்பு"],
    learn: ["12 அத்தியாயப் பாடநெறி", "தொலைதூர சுனாமி அபாயம்: அறிவிப்பிலிருந்து இயற்பியல் வரை", "மூல அளவீடு · ஆழமற்ற நீர்ச் சமன்பாடுகள் · சிதறல்"],
    analysis: ["நிச்சயமின்மைப் பகுப்பாய்வு", "உணர்திறன், சிதறல், மீளுருவாக்கக்கூடிய மொன்டே கார்லோ", "ஒவ்வொரு படத்தையும் SVG, PNG, CSV ஆக ஏற்றுமதி செய்யலாம்"],
    impact: ["தாக்கமும் பாதிப்புறுதன்மையும்", "அலை உயரத்திலிருந்து மனிதத் தாக்கம் வரை", "2004 பதிவு · பாதிப்பு ஆய்வு · சேத நிகழ்தகவு ஆய்வி"],
    methods: ["முறைகள் & மாதிரி அட்டை", "சமன்பாடுகள், எண்ணியல், சரிபார்ப்பு, வரம்புகள்", "மதிப்பாய்வுக்கும் மீளுருவாக்கத்துக்கும் ஆவணப்படுத்தப்பட்டது"],
    exercises: ["பயிற்சிகள்", "சுனாமி முன்னறிவிப்பாளர் போல் சிந்தியுங்கள்", "வினாடி வினா · கணித்துச் சரிபார் · செயல்பாட்டு முடிவு"],
    references: ["மேற்கோள்கள் & தரவு", "மூலங்கள், DOI, தரவு உரிமங்கள், மேற்கோள்", "திறந்த அறிவியல்: மேற்கோள் காட்டக்கூடியது, மீளப் பயன்படுத்தக்கூடியது"],
  },
};
const TYPE = {
  en: { sans: "Inter", serif: "'Source Serif'", size: 60, lh: 1.08, ls: "-.5px", eyebrowLs: "3px", upper: "uppercase" },
  si: { sans: "Inter, 'Noto Sans Sinhala'", serif: "'Noto Serif Sinhala'", size: 46, lh: 1.32, ls: "0", eyebrowLs: "0", upper: "none" },
  ta: { sans: "Inter, 'Noto Sans Tamil'", serif: "'Noto Serif Tamil'", size: 42, lh: 1.34, ls: "0", eyebrowLs: "0", upper: "none" },
};
// Accurate Sri Lanka (Natural Earth 1:10m via scripts/geodata.mjs), equal ground scale in x and y.
const SL = JSON.parse(readFileSync(P("brand/sri-lanka.json"), "utf8"));
const OG_ISLAND = (() => {
  const { bbox, rings } = SL;
  const mid = ((bbox.north + bbox.south) / 2) * (Math.PI / 180);
  const s = 300 / (bbox.north - bbox.south); // px per degree latitude
  const x0 = 960,
    y0 = 40;
  return rings
    .map((ring) => ring.map(([lon, lat], i) => `${i ? "L" : "M"}${(x0 + (lon - bbox.west) * Math.cos(mid) * s).toFixed(1)} ${(y0 + (bbox.north - lat) * s).toFixed(1)}`).join("") + "Z")
    .join("");
})();
const rings = Array.from({ length: 9 }, (_, i) => {
  const r = 140 + i * 105;
  return `<circle cx="760" cy="700" r="${r}" fill="none" stroke="white" stroke-opacity="${(0.16 - i * 0.014).toFixed(3)}" stroke-width="3"/>`;
}).join("");
for (const [loc, { tagline, ...sections }] of Object.entries(SECTIONS)) {
  const ty = TYPE[loc];
  for (const [key, [eyebrow, title, sub]] of Object.entries(sections)) {
    const html = `
  <div style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:${ty.sans};color:#fff;
      background:radial-gradient(900px 600px at 85% 100%, #0EA5C6 0%, transparent 60%), linear-gradient(135deg,#071a47 0%,#0A2463 45%,#0B5394 100%)">
    <svg width="1200" height="630" style="position:absolute;inset:0">${rings}
      <path d="${OG_ISLAND}" fill="#FFC94A" opacity=".95"/>
    </svg>
    <div style="position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:18px">
      <div style="width:64px;height:64px">${mark.replace("<svg ", '<svg width="64" height="64" ')}</div>
      <div><div style="font-weight:800;font-size:30px;letter-spacing:-.4px;font-family:Inter">Tsunami Lab</div>
      <div style="font-weight:700;font-size:${loc === "en" ? 13 : 15}px;letter-spacing:${loc === "en" ? "2.6px" : "0"};color:#9ad7f0">${tagline}</div></div>
    </div>
    <div style="position:absolute;left:72px;top:${loc === "en" ? 212 : 196}px;width:${loc === "en" ? 840 : 860}px">
      <div style="font-weight:700;font-size:20px;letter-spacing:${ty.eyebrowLs};text-transform:${ty.upper};color:#FFC94A">${eyebrow}</div>
      <div style="font-family:${ty.serif};font-weight:650;font-size:${ty.size}px;line-height:${ty.lh};margin-top:14px;letter-spacing:${ty.ls}">${title}</div>
      <div style="font-size:${loc === "en" ? 24 : 21}px;margin-top:22px;color:#cfe6f5;line-height:1.4">${sub}</div>
    </div>
  </div>`;
    const out = loc === "en" ? `public/og/${key}.jpg` : `public/og/${loc}/${key}.jpg`;
    writeFileSync(P(out), await png(html, 1200, 630, false, "jpeg"));
  }
}

await browser.close();
console.log("brand assets written");
