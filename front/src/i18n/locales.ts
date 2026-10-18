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
