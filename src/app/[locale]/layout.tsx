import type { Metadata } from "next";
import { RootShell, rootMetadata, viewport as rootViewport } from "@/components/site/RootShell";
import { isPrefixedLocale, PREFIXED_LOCALES } from "@/i18n/config";

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
  return <RootShell locale={isPrefixedLocale(locale) ? locale : "en"}>{children}</RootShell>;
}
