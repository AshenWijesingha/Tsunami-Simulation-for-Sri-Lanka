import type { Metadata } from "next";
import { HomeView, homeMetadata } from "@/views/HomeView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return homeMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <HomeView locale={locale} />;
}
