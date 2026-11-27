import type { Metadata } from "next";
import { RootShell, rootMetadata, viewport as rootViewport } from "@/components/site/RootShell";
import { isPrefixedLocale, PREFIXED_LOCALES } from "@/i18n/config";
import localFont from "next/font/local";

/*
 * Sinhala and Tamil fonts, self-hosted through next/font so the body fonts are preloaded on /si and
 * /ta pages (no reflow when they arrive) and English pages download none of them.
 */
const siSans = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans-sinhala/files/noto-sans-sinhala-sinhala-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-si-sans",
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0D81-0DF4, U+1CF2, U+200C-200D, U+25CC, U+111E1-111F4" }],
  adjustFontFallback: false,
});
const taSans = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans-tamil/files/noto-sans-tamil-tamil-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-ta-sans",
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0B82-0BFA, U+200C-200D, U+20B9, U+25CC" }],
  adjustFontFallback: false,
});
const siSerif = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-serif-sinhala/files/noto-serif-sinhala-sinhala-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-si-serif",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0D81-0DF4, U+1CF2, U+200C-200D, U+25CC, U+111E1-111F4" }],
  adjustFontFallback: false,
});
const taSerif = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-serif-tamil/files/noto-serif-tamil-tamil-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-ta-serif",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0B82-0BFA, U+200C-200D, U+20B9, U+25CC" }],
  adjustFontFallback: false,
});
const FONT_VARS = [siSans.variable, taSans.variable, siSerif.variable, taSerif.variable].join(" ");

export const viewport = rootViewport;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}


export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isPrefixedLocale(locale) ? rootMetadata(locale) : {};
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // Unknown first segments (e.g. /xyz) still need a document; the page itself then renders the 404.
  return (
    <RootShell locale={isPrefixedLocale(locale) ? locale : "en"} className={FONT_VARS}>
      {children}
    </RootShell>
  );
}
