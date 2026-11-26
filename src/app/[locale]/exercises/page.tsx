import type { Metadata } from "next";
import { ExercisesView, exercisesMetadata } from "@/views/ExercisesView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/exercises">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return exercisesMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/exercises">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <ExercisesView locale={locale} />;
}
