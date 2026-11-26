import type { Metadata } from "next";
import { SimulatorView, simulatorMetadata } from "@/views/SimulatorView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/simulator">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return simulatorMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/simulator">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <SimulatorView locale={locale} />;
}
