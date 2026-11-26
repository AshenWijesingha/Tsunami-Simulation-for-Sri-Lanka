export const SITE = {
  name: "Indian Ocean Tsunami Lab",
  short: "Tsunami Lab · Sri Lanka",
  tagline: "Open, reproducible far-field tsunami hazard research for Sri Lanka",
  description:
    "An open research and teaching platform for far-field tsunami hazard in Sri Lanka: a browser-based shallow-water model, empirical forecasts, uncertainty analysis, 2004 validation, and evidence on coastal impacts.",
  version: "2.0.0",
  repo: "https://github.com/AshenWijesingha/Tsunami-Simulation-for-Sri-Lanka",
};

export const NAV = [
  { href: "/", label: "Overview" },
  { href: "/simulator", label: "Simulator" },
  { href: "/learn", label: "Course" },
  { href: "/analysis", label: "Analysis" },
  { href: "/impact", label: "Impact" },
  { href: "/methods", label: "Methods" },
  { href: "/exercises", label: "Exercises" },
  { href: "/references", label: "References" },
] as const;
