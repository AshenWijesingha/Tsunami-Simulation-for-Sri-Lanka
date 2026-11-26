import type { Metadata } from "next";
import { CHAPTERS } from "@/content/chapters";
import { ChapterView, chapterMetadata } from "@/views/ChapterView";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return chapterMetadata("en", slug);
}

export default async function Page({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  return <ChapterView locale="en" slug={slug} />;
}
