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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: House, desc: "The case study and what the platform offers" },
  { href: "/simulator", label: "Simulator", icon: WavesHorizontal, desc: "Run the shallow-water model in your browser" },
  { href: "/learn", label: "Course", icon: GraduationCap, desc: "12 chapters from bulletin to physics" },
  { href: "/analysis", label: "Analysis", icon: ChartSpline, desc: "Sensitivity, dispersion and Monte Carlo" },
  { href: "/impact", label: "Impact", icon: BookOpen, desc: "2004 record, vulnerability and fragility" },
  { href: "/methods", label: "Methods", icon: FlaskConical, desc: "Model card, verification and limits" },
  { href: "/exercises", label: "Exercises", icon: FileText, desc: "Quiz, predict & verify, forecaster challenge" },
  { href: "/references", label: "References", icon: LibraryBig, desc: "Sources, data and citation" },
];
