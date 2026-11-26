import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, PlayCircle } from "lucide-react";
import { CHAPTERS } from "@/content/chapters";
import { CHAPTER_BODY } from "@/content/lecture";
import { Breadcrumbs, Container, EnglishOnlyNotice } from "@/components/ui/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { clampDescription, learningResourceLd, pageMetadata } from "@/lib/seo";
import { fmt, type Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

type Slug = keyof ReturnType<typeof getDict>["chapters"];

export function chapterMetadata(locale: Locale, slug: string): Metadata {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  const t = getDict(locale).chapters[slug as Slug];
  return pageMetadata({
    locale,
    title: t.title,
    description: clampDescription(fmt(getDict(locale).meta.pages.chapter, { summary: t.summary, n: i + 1 })),
    path: `/learn/${slug}`,
    og: "learn",
    type: "article",
  });
}

export function ChapterView({ locale, slug }: { locale: Locale; slug: string }) {
  const idx = CHAPTERS.findIndex((c) => c.slug === slug);
  if (idx < 0) notFound();
  const d = getDict(locale);
  const meta = CHAPTERS[idx];
  const c = { ...meta, ...d.chapters[meta.slug as Slug] };
  const tr = (s: string) => d.chapters[s as Slug];
  const Body = CHAPTER_BODY[c.slug];
  const prev = CHAPTERS[idx - 1],
    next = CHAPTERS[idx + 1];
  const pct = Math.round(((idx + 1) / CHAPTERS.length) * 100);
  return (
    <>
      <JsonLd data={learningResourceLd(locale, c, idx + 1)} />
      <div className="sticky top-16 z-30 h-1 bg-line" role="progressbar" aria-label={d.learn.progress} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <Container className="grid gap-12 py-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav aria-label={d.learn.chapters} className="max-lg:hidden">
          <div className="sticky top-24">
            <Link href="/learn" className="eyebrow inline-flex items-center gap-1 no-underline hover:!text-accent">
              <ArrowLeft size={13} /> {d.common.allChapters}
            </Link>
            <ol className="mt-4 space-y-0.5 border-l border-line text-sm">
              {CHAPTERS.map((ch, i) => {
                const a = ch.slug === slug;
                return (
                  <li key={ch.slug}>
                    <Link
                      href={`/learn/${ch.slug}`}
                      aria-current={a ? "page" : undefined}
                      className={`-ml-px block border-l-2 py-1.5 pl-3.5 pr-2 leading-snug no-underline ${
                        a ? "border-accent font-semibold text-accent" : "border-transparent text-fg-2 hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      <span className="tabular-nums text-muted">{i}.</span> {tr(ch.slug).title}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
        <article className="min-w-0 max-w-[780px]">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: d.nav.items.course[0], path: "/learn" },
              { name: c.k, path: `/learn/${c.slug}` },
            ]}
          />
          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow !text-accent">{fmt(d.common.chapterOf, { k: c.k, i: idx + 1, n: CHAPTERS.length })}</span>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock size={13} /> {fmt(d.common.minRead, { n: c.minutes })}
              </span>
            </div>
            <h1 className="font-display mt-2 text-[2.1rem] font-semibold leading-[1.12] tracking-tight text-fg md:text-[2.7rem]">{c.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-fg-2">{c.summary}</p>
            {c.sim && (
              <Link href={`/simulator?ch=${c.slug}`} className="btn btn-primary mt-6">
                <PlayCircle size={17} /> {d.common.showInSim}
              </Link>
            )}
          </header>
          <EnglishOnlyNotice locale={locale} className="mt-8" />
          <div className="prose-sci mt-8" lang="en">
            <Body />
          </div>
          <nav aria-label={d.learn.chapterNav} className="mt-14 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="card card-hover group p-4 no-underline">
                <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                  <ArrowLeft size={13} /> {d.common.previous}
                </span>
                <span className="mt-1 block font-semibold text-fg group-hover:text-accent">{tr(prev.slug).title}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link href={next ? `/learn/${next.slug}` : "/exercises"} className="card card-hover group p-4 text-right no-underline">
              <span className="flex items-center justify-end gap-1 text-xs font-semibold text-muted">
                {d.common.next} <ArrowRight size={13} />
              </span>
              <span className="mt-1 block font-semibold text-fg group-hover:text-accent">{next ? tr(next.slug).title : d.learn.nextExercises}</span>
            </Link>
          </nav>
        </article>
      </Container>
    </>
  );
}
