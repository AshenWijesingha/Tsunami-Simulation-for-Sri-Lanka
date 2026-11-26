import type { Metadata } from "next";
import { ImpactView, impactMetadata } from "@/views/ImpactView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/impact">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return impactMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/impact">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <ImpactView locale={locale} />;
}
