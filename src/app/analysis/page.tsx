import type { Metadata } from "next";
import { ChartSpline } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import Workbench from "@/components/analysis/Workbench";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Tsunami Uncertainty & Sensitivity Analysis",
  description:
    "Interactive tsunami analysis for Sri Lanka: amplitude decay, travel times, frequency dispersion, magnitude–mechanism sensitivity and a reproducible Monte Carlo.",
  path: "/analysis",
  og: "analysis",
  keywords: ["tsunami uncertainty", "Monte Carlo tsunami", "tsunami sensitivity analysis", "tsunami dispersion"],
});

export default function Page() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Analysis", path: "/analysis" }]}
        icon={ChartSpline}
        eyebrow="Analysis"
        title="Sensitivity and uncertainty"
        lead="How robust is a far-field forecast? Vary the source, overlay numerical results, and propagate uncertainty with a seeded Monte Carlo. Every figure exports as SVG, PNG and CSV."
      />
      <Container className="py-10">
        <Workbench />
      </Container>
    </>
  );
}
