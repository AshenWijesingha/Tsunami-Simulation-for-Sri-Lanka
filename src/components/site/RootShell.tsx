import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/source-serif-4/wght.css";
import "@fontsource-variable/noto-sans-sinhala/wght.css";
import "@fontsource-variable/noto-sans-tamil/wght.css";
import "@fontsource-variable/noto-serif-sinhala/wght.css";
import "@fontsource-variable/noto-serif-tamil/wght.css";
import "katex/dist/katex.min.css";
import "@/app/globals.css";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { THEME_SCRIPT } from "./ThemeToggle";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import { getDict } from "@/i18n/server";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function rootMetadata(locale: Locale): Metadata {
  const d = getDict(locale);
  return {
    metadataBase: new URL(SITE.origin),
    title: { default: d.meta.pages.home.title, template: `%s | ${SITE.brand}` },
    description: d.meta.description,
    applicationName: d.meta.siteName,
    keywords: SITE.keywords,
    authors: [{ name: SITE.author, url: SITE.repo }],
    creator: SITE.author,
    publisher: SITE.name,
    category: "education",
    formatDetection: { telephone: false, email: false, address: false },
    appleWebApp: { capable: true, title: SITE.brand, statusBarStyle: "black-translucent" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    // Declared explicitly (not via file conventions) so every page gets static <link> tags with the base path.
    icons: {
      icon: [
        { url: `${BASE}/favicon.ico`, sizes: "48x48", type: "image/x-icon" },
        { url: `${BASE}/icon.svg`, type: "image/svg+xml" },
        { url: `${BASE}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: `${BASE}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070f1e" },
  ],
};

export function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const d = getDict(locale);
  return (
    <html lang={LOCALE_INFO[locale].htmlLang} dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <JsonLd data={[organizationLd(), websiteLd(locale)]} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={locale} dict={d}>
          <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100]">
            {d.nav.skip}
          </a>
          <SiteHeader locale={locale} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter locale={locale} />
        </I18nProvider>
      </body>
    </html>
  );
}
