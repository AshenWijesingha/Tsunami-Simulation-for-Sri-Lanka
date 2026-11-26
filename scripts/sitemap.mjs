// Generates public/robots.txt and, when SITE_URL is set, public/sitemap.xml.
// Runs before `next build` (npm "prebuild"). Both files are build outputs and are git-ignored.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

mkdirSync("public", { recursive: true });

const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
if (!site) {
  writeFileSync("public/robots.txt", "User-agent: *\nAllow: /\n");
  rmSync("public/sitemap.xml", { force: true });
  console.log("sitemap: SITE_URL not set, wrote robots.txt only");
  process.exit(0);
}
const chapters = [...readFileSync("src/content/chapters.ts", "utf8").matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
// [path, priority, change frequency]
const pages = [
  ["", "1.0", "monthly"],
  ["simulator", "0.9", "monthly"],
  ["learn", "0.9", "monthly"],
  ["impact", "0.8", "monthly"],
  ["analysis", "0.7", "monthly"],
  ["methods", "0.7", "monthly"],
  ["exercises", "0.6", "monthly"],
  ["references", "0.5", "monthly"],
  ...chapters.map((s) => [`learn/${s}`, "0.7", "monthly"]),
];
const lastmod = (process.env.SITEMAP_LASTMOD || new Date().toISOString()).slice(0, 10);
// English lives at the root; Sinhala and Tamil under /si and /ta. Every URL lists all three as hreflang alternates.
const LOCALES = [
  ["en", ""],
  ["si", "si/"],
  ["ta", "ta/"],
];
const url = (pre, p) => `${site}/${pre}${p ? p + "/" : ""}`;
const alts = (p) =>
  LOCALES.map(([l, pre]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(pre, p)}"/>`).join("") +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${url("", p)}"/>`;
const entries = pages.flatMap(([p, pr, cf]) =>
  LOCALES.map(
    ([, pre]) => `  <url><loc>${url(pre, p)}</loc>${alts(p)}<lastmod>${lastmod}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`,
  ),
);
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  entries.join("\n") +
  "\n</urlset>\n";
writeFileSync("public/sitemap.xml", xml);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap: ${entries.length} URLs for ${site}`);
