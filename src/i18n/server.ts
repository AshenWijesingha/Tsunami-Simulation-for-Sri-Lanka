import type { Locale } from "./config";
import { en, type Dict } from "./dict/en";
import { si } from "./dict/si";
import { ta } from "./dict/ta";

const DICTS: Record<Locale, Dict> = { en, si, ta };
export const getDict = (locale: Locale): Dict => DICTS[locale];
