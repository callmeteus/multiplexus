import { en } from "./en";
import { pt } from "./pt";

const lang = (process.env.LANG || process.env.LC_ALL || "en").toLowerCase();
const isPt = lang.startsWith("pt");

/**
 * The translation function.
 * @param key The key to translate.
 * @returns The translated string.
 */
export const t = isPt ? pt : en;

/**
 * The current language.
 */
export const currentLang = isPt ? "pt" : "en";
