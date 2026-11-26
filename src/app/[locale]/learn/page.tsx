import type { Metadata } from "next";
import { LearnView, learnMetadata } from "@/views/LearnView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/learn">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return learnMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/learn">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <LearnView locale={locale} />;
}
