import type { Metadata } from "next";
import type { BreadcrumbList, Course, LearningResource, Organization, Thing, WebApplication, WebSite, WithContext } from "schema-dts";
import { SITE } from "./site";
import { LOCALES, LOCALE_INFO, localePath, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

/** Canonical absolute URL for an app path ("/", "/learn"). Trailing slash matches the static export. */
export function absUrl(path: string) {
  const p = path === "/" || path === "" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return SITE.url + p;
}
/** Absolute URL of the localised version of an app path. */
export const locUrl = (locale: Locale, path: string) => absUrl(localePath(locale, path));
export const asset = (p: string) => `${SITE.url}/${p.replace(/^\/+/, "")}`;

/** Keep meta descriptions within what search engines display (~160 chars), cutting at a word boundary. */
export function clampDescription(s: string, max = 158) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

export type OgKey = "home" | "simulator" | "learn" | "analysis" | "impact" | "methods" | "exercises" | "references";
export const ogImage = (locale: Locale, key: OgKey) => asset(locale === "en" ? `og/${key}.jpg` : `og/${locale}/${key}.jpg`);

export interface PageSeo {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  og: OgKey;
  /** Use the title as-is instead of the "%s | Tsunami Lab" template. */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
}

export function pageMetadata(s: PageSeo): Metadata {
  const url = locUrl(s.locale, s.path);
  const image = { url: ogImage(s.locale, s.og), width: 1200, height: 630, alt: s.title };
  const fullTitle = s.absoluteTitle ? s.title : `${s.title} | ${SITE.brand}`;
  const languages: Record<string, string> = { "x-default": locUrl("en", s.path) };
  for (const l of LOCALES) languages[LOCALE_INFO[l].hreflang] = locUrl(l, s.path);
  return {
    title: s.absoluteTitle ? { absolute: s.title } : s.title,
    description: clampDescription(s.description, 200),
    keywords: s.keywords ? [...s.keywords, ...SITE.keywords.slice(0, 4)] : SITE.keywords,
    alternates: { canonical: url, languages },
    openGraph: {
      type: s.type ?? "website",
      url,
      siteName: getDict(s.locale).meta.siteName,
      locale: LOCALE_INFO[s.locale].og,
      alternateLocale: LOCALES.filter((l) => l !== s.locale).map((l) => LOCALE_INFO[l].og),
      title: fullTitle,
      description: s.description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: s.description, images: [image] },
    robots: s.noindex ? { index: false, follow: true } : undefined,
  };
}

/** Metadata for a standard section page, from the dictionary. */
export function sectionMetadata(locale: Locale, key: Exclude<OgKey, "home">, path: string, extra: Partial<PageSeo> = {}): Metadata {
  const m = getDict(locale).meta.pages[key];
  return pageMetadata({ locale, title: m.title, description: m.description, path, og: key, ...extra });
}

/* ---------------- structured data (schema.org JSON-LD) ---------------- */

export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;

export function organizationLd(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    alternateName: SITE.brand,
    url: absUrl("/"),
    logo: { "@type": "ImageObject", url: asset("icons/icon-512.png"), width: "512", height: "512" },
    sameAs: [SITE.repo],
  };
}

export function websiteLd(locale: Locale): WithContext<WebSite> {
  const d = getDict(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: d.meta.siteName,
    alternateName: SITE.brand,
    url: locUrl(locale, "/"),
    description: d.meta.description,
    inLanguage: LOCALES.map((l) => LOCALE_INFO[l].htmlLang),
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbLd(locale: Locale, items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: locUrl(locale, it.path) })),
  };
}

export function webAppLd(locale: Locale): WithContext<WebApplication> {
  const d = getDict(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: d.meta.pages.simulator.title,
    url: locUrl(locale, "/simulator"),
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Scientific simulation",
    operatingSystem: "Any (modern web browser with WebGL)",
    browserRequirements: "Requires JavaScript, Web Workers and WebGL",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: d.meta.pages.simulator.description,
    image: ogImage(locale, "simulator"),
    publisher: { "@id": ORG_ID },
    inLanguage: LOCALE_INFO[locale].htmlLang,
  };
}

export function courseLd(locale: Locale, chapters: { slug: string; title: string; summary: string }[]): WithContext<Course> {
  const d = getDict(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: d.learn.title,
    description: d.meta.pages.learn.description,
    url: locUrl(locale, "/learn"),
    provider: { "@id": ORG_ID },
    inLanguage: LOCALE_INFO[locale].htmlLang,
    isAccessibleForFree: true,
    educationalLevel: "Graduate",
    teaches: d.learn.outcomes,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT6H" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free" },
    syllabusSections: chapters.map((c) => ({ "@type": "Syllabus", name: c.title, description: c.summary, url: locUrl(locale, `/learn/${c.slug}`) })),
    image: ogImage(locale, "learn"),
  } as WithContext<Course>;
}

export function learningResourceLd(locale: Locale, c: { slug: string; title: string; summary: string }, position: number): WithContext<LearningResource> {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: c.title,
    description: c.summary,
    url: locUrl(locale, `/learn/${c.slug}`),
    learningResourceType: "Lecture",
    educationalLevel: "Graduate",
    inLanguage: LOCALE_INFO[locale].htmlLang,
    isAccessibleForFree: true,
    position,
    isPartOf: { "@type": "Course", name: getDict(locale).learn.title, url: locUrl(locale, "/learn") },
    publisher: { "@id": ORG_ID },
  };
}

export function articleLd(a: {
  locale: Locale;
  type: "Article" | "TechArticle" | "ScholarlyArticle";
  headline: string;
  description: string;
  path: string;
  og: OgKey;
  about?: string[];
}): WithContext<Thing> {
  return {
    "@context": "https://schema.org",
    "@type": a.type,
    headline: a.headline,
    description: a.description,
    url: locUrl(a.locale, a.path),
    mainEntityOfPage: locUrl(a.locale, a.path),
    image: ogImage(a.locale, a.og),
    // The article body itself is in English on every locale.
    inLanguage: "en",
    author: { "@type": "Person", name: SITE.author },
    publisher: { "@id": ORG_ID },
    datePublished: "2026-11-26",
    dateModified: "2026-11-26",
    isAccessibleForFree: true,
    about: a.about?.map((name) => ({ "@type": "Thing", name })),
  } as WithContext<Thing>;
}
