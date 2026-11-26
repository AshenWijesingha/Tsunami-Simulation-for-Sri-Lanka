import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { FileText } from "lucide-react";
import { sectionMetadata } from "@/lib/seo";
import Exercises from "@/components/exercises/Exercises";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const exercisesMetadata = (locale: Locale): Metadata => sectionMetadata(locale, "exercises", "/exercises", { keywords: ["tsunami quiz", "tsunami forecasting exercise", "tsunami education"] });

export function ExercisesView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const P = t.pages.exercises;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "Far-field tsunami hazard: concept quiz and forecasting exercises",
          educationalLevel: "Graduate",
          about: ["Tsunami", "Tsunami warning", "Shallow-water equations"],
          isAccessibleForFree: true,
          inLanguage: "en",
        }}
      />
      <PageHeader
        locale={locale}
        crumbs={[{ name: t.nav.items.exercises[0], path: "/exercises" }]}
        icon={FileText}
        eyebrow={P.eyebrow}
        title={P.title}
        lead={P.lead}
      />
      <Container className="py-10">
        <Exercises />
      </Container>
    </>
  );
}
