import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";
import { ChartSpline } from "lucide-react";
import { sectionMetadata } from "@/lib/seo";
import Workbench from "@/components/analysis/Workbench";
import { Container, EnglishOnlyNotice, PageHeader } from "@/components/ui/PageHeader";

export const analysisMetadata = (locale: Locale): Metadata => sectionMetadata(locale, "analysis", "/analysis", { keywords: ["tsunami uncertainty", "Monte Carlo tsunami", "tsunami sensitivity analysis", "tsunami dispersion"] });

export function AnalysisView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const P = t.pages.analysis;
  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ name: t.nav.items.analysis[0], path: "/analysis" }]}
        icon={ChartSpline}
        eyebrow={P.eyebrow}
        title={P.title}
        lead={P.lead}
      />
      {locale !== "en" && (
        <Container className="pt-8">
          <EnglishOnlyNotice locale={locale} />
        </Container>
      )}
      <Container lang={locale === "en" ? undefined : "en"} className="py-10">
        <Workbench />
      </Container>
    </>
  );
}
