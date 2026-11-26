import type { Metadata } from "next";
import { ReferencesView, referencesMetadata } from "@/views/ReferencesView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/references">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return referencesMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/references">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <ReferencesView locale={locale} />;
}
