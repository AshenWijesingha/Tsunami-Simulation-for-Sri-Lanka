import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS } from "@/content/chapters";
import { Container, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Course",
  description: "A 12-chapter graduate-level course on far-field tsunami hazard for Sri Lanka, from source physics to validation and research directions.",
};

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Course · 12 chapters"
        title="Far-field tsunami hazard: from a bulletin to the physics"
        lead="A structured walk through the science behind an operational tsunami decision. Written for graduate students, researchers and practitioners; usable as a lecture with the simulator on screen."
      />
      <Container className="py-10">
        <ol className="grid gap-3 md:grid-cols-2">
          {CHAPTERS.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/learn/${c.slug}`} className="card group flex h-full gap-4 p-5 no-underline hover:border-accent">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent-soft font-extrabold text-accent">{i}</span>
                <span>
                  <span className="eyebrow text-accent">{c.k}</span>
                  <span className="mt-0.5 block text-lg font-bold text-fg group-hover:text-accent">{c.title}</span>
                  <span className="mt-1 block text-sm text-fg-2">{c.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
