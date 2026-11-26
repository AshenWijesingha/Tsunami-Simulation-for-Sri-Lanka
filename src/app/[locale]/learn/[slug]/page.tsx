import type { Metadata } from "next";
import { CHAPTERS } from "@/content/chapters";
import { ChapterView, chapterMetadata } from "@/views/ChapterView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/learn/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return chapterMetadata(locale, slug);
}

export default async function Page({ params }: PageProps<"/[locale]/learn/[slug]">) {
  const { locale, slug } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <ChapterView locale={locale} slug={slug} />;
}
