import type { Metadata } from "next";
import Exercises from "@/components/exercises/Exercises";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Exercises",
  description: "Interactive exercises on far-field tsunami hazard: concept quiz, predict and verify, the operational decision, and a timed forecaster challenge.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Practice" title="Exercises" lead="Test your reasoning the way forecasters must: quickly, with incomplete information, and against an independent model." />
      <Container className="py-10">
        <Exercises />
      </Container>
    </>
  );
}
