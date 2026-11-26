import type { Metadata } from "next";
import type { BreadcrumbList, Course, LearningResource, Organization, Thing, WebApplication, WebSite, WithContext } from "schema-dts";
import { SITE } from "./site";

/** Canonical absolute URL for an app path ("/", "/learn", "/learn/overview"). Trailing slash matches the static export. */
export function absUrl(path: string) {
  const p = path === "/" || path === "" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return SITE.url + p;
}
export const asset = (p: string) => `${SITE.url}/${p.replace(/^\/+/, "")}`;

/** Keep meta descriptions within what search engines display (~160 chars), cutting at a word boundary. */
export function clampDescription(s: string, max = 158) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

export type OgKey = "home" | "simulator" | "learn" | "analysis" | "impact" | "methods" | "exercises" | "references";

export interface PageSeo {
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
  const url = absUrl(s.path);
  const image = { url: asset(`og/${s.og}.jpg`), width: 1200, height: 630, alt: `${SITE.name}: ${s.title}` };
  const fullTitle = s.absoluteTitle ? s.title : `${s.title} | ${SITE.brand}`;
  return {
    title: s.absoluteTitle ? { absolute: s.title } : s.title,
    description: s.description,
    keywords: s.keywords ? [...s.keywords, ...SITE.keywords.slice(0, 4)] : SITE.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: s.type ?? "website",
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title: fullTitle,
      description: s.description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: s.description, images: [image] },
    robots: s.noindex ? { index: false, follow: true } : undefined,
  };
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

export function websiteLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE.name,
    alternateName: SITE.brand,
    url: absUrl("/"),
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absUrl(it.path) })),
  };
}

export function webAppLd(): WithContext<WebApplication> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${SITE.brand} tsunami simulator`,
    url: absUrl("/simulator"),
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Scientific simulation",
    operatingSystem: "Any (modern web browser with WebGL)",
    browserRequirements: "Requires JavaScript, Web Workers and WebGL",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Linear shallow-water tsunami model of the Indian Ocean on a spherical C-grid, run in the browser, with synthetic tide gauges for 21 Sri Lankan coastal stations.",
    image: asset("og/simulator.jpg"),
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function courseLd(chapters: { slug: string; title: string; summary: string }[]): WithContext<Course> {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Far-field tsunami hazard: from a bulletin to the physics",
    description:
      "A 12-chapter graduate-level course on far-field tsunami hazard for Sri Lanka: source scaling, shallow-water equations, dispersion, shoaling, uncertainty and validation against the 2004 Indian Ocean tsunami.",
    url: absUrl("/learn"),
    provider: { "@id": ORG_ID },
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: "Graduate",
    teaches: ["Tsunami source physics", "Shallow-water equations", "Frequency dispersion", "Coastal shoaling", "Uncertainty quantification", "Tsunami warning decisions"],
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT6H" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free" },
    syllabusSections: chapters.map((c) => ({ "@type": "Syllabus", name: c.title, description: c.summary, url: absUrl(`/learn/${c.slug}`) })),
    image: asset("og/learn.jpg"),
  } as WithContext<Course>;
}

export function learningResourceLd(c: { slug: string; title: string; summary: string }, position: number): WithContext<LearningResource> {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: c.title,
    description: c.summary,
    url: absUrl(`/learn/${c.slug}`),
    learningResourceType: "Lecture",
    educationalLevel: "Graduate",
    inLanguage: "en",
    isAccessibleForFree: true,
    position,
    isPartOf: { "@type": "Course", name: "Far-field tsunami hazard: from a bulletin to the physics", url: absUrl("/learn") },
    publisher: { "@id": ORG_ID },
  };
}

export function articleLd(a: { type: "Article" | "TechArticle" | "ScholarlyArticle"; headline: string; description: string; path: string; og: OgKey; about?: string[] }): WithContext<Thing> {
  return {
    "@context": "https://schema.org",
    "@type": a.type,
    headline: a.headline,
    description: a.description,
    url: absUrl(a.path),
    mainEntityOfPage: absUrl(a.path),
    image: asset(`og/${a.og}.jpg`),
    inLanguage: "en",
    author: { "@type": "Person", name: SITE.author },
    publisher: { "@id": ORG_ID },
    datePublished: "2026-11-26",
    dateModified: "2026-11-26",
    isAccessibleForFree: true,
    about: a.about?.map((name) => ({ "@type": "Thing", name })),
  } as WithContext<Thing>;
}
