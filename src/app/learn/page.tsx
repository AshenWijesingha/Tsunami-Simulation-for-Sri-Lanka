import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Clock, GraduationCap, ListChecks, WavesHorizontal } from "lucide-react";
import { CHAPTERS } from "@/content/chapters";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Tsunami Science Course: 12 Free Chapters",
  description:
    "Free graduate-level course on far-field tsunami hazard: source scaling, shallow-water equations, dispersion, shoaling and the 2004 Indian Ocean tsunami.",
  path: "/learn",
  og: "learn",
  keywords: ["tsunami course", "tsunami physics", "shallow water equations course", "tsunami lecture"],
});

const total = CHAPTERS.reduce((a, c) => a + c.minutes, 0);

export default function Page() {
  return (
    <>
      <JsonLd data={courseLd(CHAPTERS)} />
      <PageHeader
        crumbs={[{ name: "Course", path: "/learn" }]}
        eyebrow="Course · 12 chapters"
        icon={GraduationCap}
        title="Far-field tsunami hazard: from a bulletin to the physics"
        lead="A structured walk through the science behind a real tsunami warning decision. Written for graduate students, researchers and practitioners, and designed to be taught with the simulator on screen."
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">
            <Clock size={14} /> About {total} min of reading
          </span>
          <span className="chip">
            <Award size={14} /> Graduate level
          </span>
          <span className="chip">
            <WavesHorizontal size={14} /> Linked to the simulator
          </span>
        </div>
        <Link href="/learn/overview" className="btn btn-primary btn-lg mt-7">
          Start with the overview <ArrowRight size={18} />
        </Link>
      </PageHeader>
      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ol className="grid gap-3">
          {CHAPTERS.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/learn/${c.slug}`} className="card card-hover group flex gap-4 p-5 no-underline">
                <span className="font-display grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">{i}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="eyebrow !text-accent">{c.k}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} /> {c.minutes} min
                    </span>
                  </span>
                  <span className="mt-1 block text-lg font-bold leading-snug text-fg group-hover:text-accent">{c.title}</span>
                  <span className="mt-1 block text-sm text-fg-2">{c.summary}</span>
                </span>
                <ArrowRight size={18} className="mt-1 flex-none text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ol>
        <aside className="space-y-4 self-start lg:sticky lg:top-24">
          <div className="card p-5">
            <div className="flex items-center gap-2 font-bold text-fg">
              <ListChecks size={18} className="text-accent" /> You will learn to
            </div>
            <ul className="mt-3 space-y-2 text-sm text-fg-2">
              <li>Derive tsunami source parameters from earthquake magnitude</li>
              <li>Solve the shallow-water equations on a sphere</li>
              <li>Explain decay, refraction, dispersion and shoaling</li>
              <li>Compare numerical and empirical forecasts with uncertainty</li>
              <li>Validate a model against the 2004 tsunami</li>
              <li>Connect hazard to exposure, vulnerability and warning</li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="font-bold text-fg">Practise as you go</div>
            <p className="mt-1.5 text-sm text-fg-2">Test yourself with the quiz, predict-and-verify task and the timed forecaster challenge.</p>
            <Link href="/exercises" className="btn mt-3 w-full">
              Go to exercises <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </Container>
    </>
  );
}
