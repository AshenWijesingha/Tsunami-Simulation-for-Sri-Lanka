"use client";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "./config";
import { useLocale } from "./client";

/** Drop-in replacement for next/link that keeps the current language. */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const h = typeof href === "string" ? localePath(locale, href) : href;
  return <NextLink href={h} {...rest} />;
}
