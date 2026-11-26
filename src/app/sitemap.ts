import type { MetadataRoute } from "next";
import { CHAPTERS } from "@/content/chapters";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsunami-lab.example.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/simulator", "/learn", "/analysis", "/impact", "/methods", "/exercises", "/references"];
  return [...pages.map((p) => ({ url: BASE + p })), ...CHAPTERS.map((c) => ({ url: `${BASE}/learn/${c.slug}` }))];
}
