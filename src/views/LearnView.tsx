import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { ArrowRight, Award, Clock, GraduationCap, ListChecks, WavesHorizontal } from "lucide-react";
import { CHAPTERS } from "@/content/chapters";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseLd, sectionMetadata } from "@/lib/seo";
import { fmt, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

export const learnMetadata = (locale: Locale): Metadata =>
  sectionMetadata(locale, "learn", "/learn", { keywords: ["tsunami course", "tsunami physics", "shallow water equations course", "tsunami lecture"] });

const total = CHAPTERS.reduce((a, c) => a + c.minutes, 0);

export function LearnView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const L = t.learn;
  const chapters = CHAPTERS.map((c) => ({ ...c, ...t.chapters[c.slug as keyof typeof t.chapters] }));
  return (
    <>
      <JsonLd data={courseLd(locale, chapters)} />
      <PageHeader
        locale={locale}
        crumbs={[{ name: t.nav.items.course[0], path: "/learn" }]}
        eyebrow={L.eyebrow}
        icon={GraduationCap}
        title={L.title}
        lead={L.lead}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">
            <Clock size={14} /> {fmt(L.reading, { n: total })}
          </span>
          <span className="chip">
            <Award size={14} /> {L.level}
          </span>
          <span className="chip">
            <WavesHorizontal size={14} /> {L.linked}
          </span>
        </div>
        <Link href="/learn/overview" className="btn btn-primary btn-lg mt-7">
          {L.start} <ArrowRight size={18} />
        </Link>
      </PageHeader>
      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ol className="grid gap-3">
          {chapters.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/learn/${c.slug}`} className="card card-hover group flex gap-4 p-5 no-underline">
                <span className="font-display grid h-11 w-11 flex-none place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">{i}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="eyebrow !text-accent">{c.k}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} /> {fmt(t.common.min, { n: c.minutes })}
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
              <ListChecks size={18} className="text-accent" /> {L.outcomesTitle}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-fg-2">
              {L.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <div className="font-bold text-fg">{L.practiseTitle}</div>
            <p className="mt-1.5 text-sm text-fg-2">{L.practiseText}</p>
            <Link href="/exercises" className="btn mt-3 w-full">
              {L.practiseCta} <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </Container>
    </>
  );
}
