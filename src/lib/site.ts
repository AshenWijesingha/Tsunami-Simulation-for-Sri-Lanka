import type { LucideIcon } from "lucide-react";
import { BookOpen, ChartSpline, FileText, FlaskConical, GraduationCap, House, LibraryBig, WavesHorizontal } from "lucide-react";

const DEFAULT_URL = "https://ashenwijesingha.github.io/Tsunami-Simulation-for-Sri-Lanka";

/** Public URL of the deployed site (no trailing slash). Set at build time via SITE_URL. */
const url = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_URL).replace(/\/+$/, "");

export const SITE = {
  name: "Indian Ocean Tsunami Lab",
  brand: "Tsunami Lab",
  region: "Indian Ocean · Sri Lanka",
  tagline: "Open, reproducible far-field tsunami hazard research and teaching for Sri Lanka",
  description:
    "Free, open platform to simulate Indian Ocean tsunamis in your browser, learn the science in a 12-chapter course, and explore coastal impact in Sri Lanka.",
  version: "2.1.0",
  repo: "https://github.com/AshenWijesingha/Tsunami-Simulation-for-Sri-Lanka",
  author: "Ashen Wijesingha",
  url,
  origin: new URL(url).origin,
  locale: "en_GB",
  keywords: [
    "tsunami",
    "tsunami simulation",
    "Sri Lanka tsunami",
    "Indian Ocean tsunami",
    "2004 tsunami",
    "tsunami hazard assessment",
    "shallow water equations",
    "tsunami early warning",
    "tsunami education",
    "coastal hazard",
    "disaster risk reduction",
    "earthquake tsunami model",
  ],
};

export type NavKey = "overview" | "simulator" | "course" | "analysis" | "impact" | "methods" | "exercises" | "references";

export interface NavItem {
  href: string;
  key: NavKey;
  icon: LucideIcon;
}

/** Labels and descriptions come from the dictionary (dict.nav.items[key]). */
export const NAV: NavItem[] = [
  { href: "/", key: "overview", icon: House },
  { href: "/simulator", key: "simulator", icon: WavesHorizontal },
  { href: "/learn", key: "course", icon: GraduationCap },
  { href: "/analysis", key: "analysis", icon: ChartSpline },
  { href: "/impact", key: "impact", icon: BookOpen },
  { href: "/methods", key: "methods", icon: FlaskConical },
  { href: "/exercises", key: "exercises", icon: FileText },
  { href: "/references", key: "references", icon: LibraryBig },
];
