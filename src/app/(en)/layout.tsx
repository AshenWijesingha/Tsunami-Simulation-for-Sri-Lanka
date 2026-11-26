import type { Metadata } from "next";
import { RootShell, rootMetadata, viewport as rootViewport } from "@/components/site/RootShell";

export const metadata: Metadata = rootMetadata("en");
export const viewport = rootViewport;

export default function EnglishLayout({ children }: LayoutProps<"/">) {
  return <RootShell locale="en">{children}</RootShell>;
}
