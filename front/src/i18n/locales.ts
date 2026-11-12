export const LOCALES = ["fr", "en", "nl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tag (Belgian concession) used for `<html lang>` and to format numbers,
 * prices and dates for each site language. */
export const INTL_LOCALES: Record<Locale, string> = {
  fr: "fr-BE",
  en: "en-GB",
  nl: "nl-BE",
};

/** Cookie remembering the last language used (1 year), read by `proxy.ts`
 * when an address without a language (`/`, `/annonces`…) is opened. */
export const LOCALE_COOKIE = "chcars_locale";

/**
 * Best site language for an `Accept-Language` header: every language the
 * browser lists is considered, by preference (`q`), so
 * `de-DE, nl;q=0.9, fr;q=0.8` gives Dutch. `null` when none is supported.
 */
export function negotiateLocale(header: string | null | undefined): Locale | null {
  const ranked = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((param) => /^\s*q=([\d.]+)\s*$/.exec(param)?.[1]).find(Boolean);
      return { language: tag.trim().split("-")[0].toLowerCase(), q: q === undefined ? 1 : Number(q), index };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  const match = ranked.find((entry) => isLocale(entry.language));
  return match ? (match.language as Locale) : null;
}
