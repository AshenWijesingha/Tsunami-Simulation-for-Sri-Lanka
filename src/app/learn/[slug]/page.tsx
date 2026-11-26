import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAPTERS, chapterBySlug } from "@/content/chapters";
import { CHAPTER_BODY } from "@/content/lecture";
import { Container } from "@/components/ui/PageHeader";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = chapterBySlug(slug);
  return c ? { title: `${c.k}: ${c.title}`, description: c.summary } : {};
}

export default async function Page({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const idx = CHAPTERS.findIndex((c) => c.slug === slug);
  if (idx < 0) notFound();
  const c = CHAPTERS[idx];
  const Body = CHAPTER_BODY[c.slug];
  const prev = CHAPTERS[idx - 1],
    next = CHAPTERS[idx + 1];
  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Chapters" className="max-lg:hidden">
        <div className="sticky top-20">
          <Link href="/learn" className="eyebrow no-underline">
            ← Course
          </Link>
          <ol className="mt-3 space-y-0.5 text-sm">
            {CHAPTERS.map((ch, i) => (
              <li key={ch.slug}>
                <Link
                  href={`/learn/${ch.slug}`}
                  aria-current={ch.slug === slug ? "page" : undefined}
                  className={`block rounded-lg px-2.5 py-1.5 no-underline ${ch.slug === slug ? "bg-accent-soft font-bold text-accent" : "text-fg-2 hover:bg-panel-2"}`}
                >
                  <span className="tabular-nums text-muted">{i}.</span> {ch.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </nav>
      <article className="min-w-0 max-w-[760px]">
        <div className="eyebrow text-accent">
          {c.k} · {idx + 1}/{CHAPTERS.length}
        </div>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-fg md:text-4xl text-balance">{c.title}</h1>
        <p className="mt-3 text-lg text-fg-2">{c.summary}</p>
        {c.sim && (
          <Link href={`/simulator?ch=${c.slug}`} className="btn btn-primary mt-5">
            ▶ Show in simulator
          </Link>
        )}
        <div className="prose-sci mt-6">
          <Body />
        </div>
        <div className="mt-12 flex justify-between gap-3 border-t border-line pt-5">
          {prev ? (
            <Link href={`/learn/${prev.slug}`} className="btn">
              ← {prev.k}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/learn/${next.slug}`} className="btn btn-primary">
              {next.k} →
            </Link>
          ) : (
            <Link href="/exercises" className="btn btn-primary">
              Exercises →
            </Link>
          )}
        </div>
      </article>
    </Container>
  );
}
