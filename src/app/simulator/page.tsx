import type { Metadata } from "next";
import { Suspense } from "react";
import SimulatorClient, { SimulatorSkeleton } from "@/components/sim/SimulatorClient";

export const metadata: Metadata = {
  title: "Numerical simulator",
  description:
    "Run a linear shallow-water tsunami model of the Indian Ocean in your browser: actual M6.5 event, hypothetical sources and the 2004 validation case, with synthetic tide gauges for 21 Sri Lankan coastal stations.",
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Numerical tsunami simulator</h1>
      <Suspense fallback={<SimulatorSkeleton />}>
        <SimulatorClient />
      </Suspense>
    </>
  );
}
