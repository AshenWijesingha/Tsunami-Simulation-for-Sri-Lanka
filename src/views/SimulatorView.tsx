import type { Metadata } from "next";
import { Suspense } from "react";
import SimulatorClient, { SimulatorSkeleton } from "@/components/sim/SimulatorClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, sectionMetadata, webAppLd } from "@/lib/seo";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

export const simulatorMetadata = (locale: Locale): Metadata =>
  sectionMetadata(locale, "simulator", "/simulator", {
    keywords: ["tsunami simulator", "tsunami simulation online", "Indian Ocean tsunami model", "tsunami travel time map"],
  });

export function SimulatorView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <>
      <JsonLd
        data={[
          webAppLd(locale),
          breadcrumbLd(locale, [
            { name: t.nav.home, path: "/" },
            { name: t.nav.items.simulator[0], path: "/simulator" },
          ]),
        ]}
      />
      <h1 className="sr-only">{t.meta.pages.simulator.title}</h1>
      <Suspense fallback={<SimulatorSkeleton />}>
        <SimulatorClient />
      </Suspense>
    </>
  );
}
