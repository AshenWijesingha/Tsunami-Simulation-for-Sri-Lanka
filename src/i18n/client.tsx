"use client";
import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import type { Dict } from "./dict/en";
import { en } from "./dict/en";

const Ctx = createContext<{ locale: Locale; dict: Dict }>({ locale: DEFAULT_LOCALE, dict: en });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, dict }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).dict;
export const useLocale = () => useContext(Ctx).locale;
