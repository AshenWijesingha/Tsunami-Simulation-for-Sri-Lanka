// Generates public/robots.txt and, when SITE_URL is set, public/sitemap.xml.
// Runs before `next build` (npm "prebuild"). Both files are build outputs and are git-ignored.
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
if (!site) {
  writeFileSync("public/robots.txt", "User-agent: *\nAllow: /\n");
  rmSync("public/sitemap.xml", { force: true });
  console.log("sitemap: SITE_URL not set, wrote robots.txt only");
  process.exit(0);
}
const chapters = [...readFileSync("src/content/chapters.ts", "utf8").matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const pages = ["", "simulator", "learn", "analysis", "impact", "methods", "exercises", "references", ...chapters.map((s) => `learn/${s}`)];
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((p) => `  <url><loc>${site}/${p ? p + "/" : ""}</loc></url>`).join("\n") +
  "\n</urlset>\n";
writeFileSync("public/sitemap.xml", xml);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap: ${pages.length} URLs for ${site}`);
