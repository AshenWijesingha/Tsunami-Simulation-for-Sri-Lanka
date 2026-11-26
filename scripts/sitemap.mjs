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
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages
    .map(([p, pr, cf]) => `  <url><loc>${site}/${p ? p + "/" : ""}</loc><lastmod>${lastmod}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`)
    .join("\n") +
  "\n</urlset>\n";
writeFileSync("public/sitemap.xml", xml);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap: ${pages.length} URLs for ${site}`);
