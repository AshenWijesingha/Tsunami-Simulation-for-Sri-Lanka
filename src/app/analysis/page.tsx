import type { Metadata } from "next";
import Workbench from "@/components/analysis/Workbench";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Uncertainty analysis",
  description: "Empirical tsunami decay laws, travel times, frequency dispersion, magnitude–mechanism sensitivity and a reproducible Monte Carlo for Sri Lanka.",
};

export default function Page() {
  return (
    <>
      <PageHeader
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
