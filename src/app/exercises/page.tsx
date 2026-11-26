import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FileText } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import Exercises from "@/components/exercises/Exercises";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Tsunami Forecasting Exercises & Quiz",
  description:
    "Practise tsunami forecasting: a graduate-level concept quiz, predict-and-verify against a numerical model, the operational decision, and a timed challenge.",
  path: "/exercises",
  og: "exercises",
  keywords: ["tsunami quiz", "tsunami forecasting exercise", "tsunami education"],
});

export default function Page() {
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
        crumbs={[{ name: "Exercises", path: "/exercises" }]}
        icon={FileText}
        eyebrow="Practice"
        title="Think like a tsunami forecaster"
        lead="Test your reasoning the way forecasters must: quickly, with incomplete information, and against an independent model."
      />
      <Container className="py-10">
        <Exercises />
      </Container>
    </>
  );
}
