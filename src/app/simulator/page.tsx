import type { Metadata } from "next";
import { Suspense } from "react";
import SimulatorClient, { SimulatorSkeleton } from "@/components/sim/SimulatorClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, pageMetadata, webAppLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tsunami Simulator: Indian Ocean Wave Model",
  description:
    "Run a free Indian Ocean tsunami simulation in your browser: the real 2026 M6.5 event, your own source, or the 2004 tsunami, with tide gauges for Sri Lanka.",
  path: "/simulator",
  og: "simulator",
  keywords: ["tsunami simulator", "tsunami simulation online", "Indian Ocean tsunami model", "tsunami travel time map"],
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          webAppLd(),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Simulator", path: "/simulator" },
          ]),
        ]}
      />
      <h1 className="sr-only">Indian Ocean tsunami simulator</h1>
      <Suspense fallback={<SimulatorSkeleton />}>
        <SimulatorClient />
      </Suspense>
    </>
  );
}
