import type { Metadata } from "next";
import { MethodsView, methodsMetadata } from "@/views/MethodsView";
import { notFound } from "next/navigation";
import { isPrefixedLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/methods">): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) return {};
  return methodsMetadata(locale);
}

export default async function Page({ params }: PageProps<"/[locale]/methods">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale)) notFound();
  return <MethodsView locale={locale} />;
}
