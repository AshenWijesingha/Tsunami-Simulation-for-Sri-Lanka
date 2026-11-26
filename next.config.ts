import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a fully static site into `out/` (used for GitHub Pages).
 * BASE_PATH sets the sub-path the site is served from, e.g. "/Tsunami-Simulation-for-Sri-Lanka".
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Partial prerendering (Cache Components) needs a Node server, so it is off for static exports.
  // Every page is fully static anyway; the model runs in the browser.
  ...(staticExport
    ? { output: "export" as const, trailingSlash: true }
    : { cacheComponents: true, partialPrefetching: true }),
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
