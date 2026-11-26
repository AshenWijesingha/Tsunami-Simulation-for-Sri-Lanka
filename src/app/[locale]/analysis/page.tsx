import type { Metadata } from "next";
import { AnalysisView, analysisMetadata } from "@/views/AnalysisView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/analysis">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return analysisMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/analysis">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <AnalysisView locale={locale} />;
}
