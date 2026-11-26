export const LOCALES = ["en", "si", "ta"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** Locales served under a path prefix (English stays at the root). */
export const PREFIXED_LOCALES = ["si", "ta"] as const satisfies readonly Locale[];

export const LOCALE_INFO: Record<Locale, { label: string; english: string; htmlLang: string; og: string; hreflang: string }> = {
  en: { label: "English", english: "English", htmlLang: "en", og: "en_GB", hreflang: "en" },
  si: { label: "සිංහල", english: "Sinhala", htmlLang: "si", og: "si_LK", hreflang: "si" },
  ta: { label: "தமிழ்", english: "Tamil", htmlLang: "ta", og: "ta_LK", hreflang: "ta" },
};

export const isLocale = (s: string): s is Locale => (LOCALES as readonly string[]).includes(s);

/** Prefix an app path with the locale ("/learn" → "/si/learn"); leaves external links, hashes and queries alone. */
export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (locale === DEFAULT_LOCALE) return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/** Strip any locale prefix from a pathname ("/ta/learn" → "/learn"). */
export function stripLocale(path: string): string {
  for (const l of PREFIXED_LOCALES) {
    if (path === `/${l}` || path === `/${l}/`) return "/";
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

/** Replace {name} placeholders. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export const isPrefixedLocale = (s: string): s is (typeof PREFIXED_LOCALES)[number] => (PREFIXED_LOCALES as readonly string[]).includes(s);
