import type { Metadata } from "next";
import { headers } from "next/headers";
import { fr, en, nl, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, INTL_LOCALES, LOCALES, isLocale, type Locale } from "./locales";

/**
 * Server-side page metadata: translated tab titles and the `hreflang` links
 * telling search engines that `/fr/x`, `/en/x` and `/nl/x` are the same page
 * in three languages. The pages themselves are client components, so each
 * public section has a small server `layout.tsx` exporting its metadata.
 */

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, nl };

export const SITE_NAME = "BrabusCars";
/** Completes every page title: « Mes favoris · BrabusCars ». */
export const TITLE_TEMPLATE = `%s · ${SITE_NAME}`;

export type LocaleParams = Promise<{ locale: string }>;

export async function resolveLocale(params: LocaleParams): Promise<{ locale: Locale; t: Dictionary }> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { locale, t: DICTIONARIES[locale] };
}

/**
 * Origin of the site as the visitor reached it (`https://brabuscars.be`,
 * the preprod domain, `http://localhost:3000`): relative URLs in the
 * metadata are made absolute against it, nothing is fixed at build time.
 */
export async function siteOrigin(): Promise<URL> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = list.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return new URL(`${proto}://${host}`);
}

/**
 * Canonical address of the page in `locale` and its versions in the other
 * languages (`path` without locale, "" for the home page). French is also
 * the version for any other language (`x-default`).
 */
export function localeAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const value of LOCALES) languages[INTL_LOCALES[value]] = `/${value}${path}`;
  languages["x-default"] = `/${DEFAULT_LOCALE}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

type MetaKey = Exclude<keyof Dictionary["meta"], "siteTitle" | "siteDescription">;

/**
 * `generateMetadata` of a section: translated title (« Mes favoris ·
 * BrabusCars ») and, for public pages,
 * the canonical and `hreflang` links. Personal pages (account, sign-in…)
 * are kept out of search results instead.
 */
export function sectionMetadata(
  title: MetaKey,
  path: string,
  options: { description?: MetaKey; index?: boolean } = {},
) {
  return async ({ params }: { params: LocaleParams }): Promise<Metadata> => {
    const { locale, t } = await resolveLocale(params);
    // A plain string would end the « · BrabusCars » template for the pages
    // below (the listing page under /annonces): passed on explicitly.
    const pageTitle = { absolute: `${t.meta[title]} · ${SITE_NAME}`, template: TITLE_TEMPLATE };
    if (options.index === false) {
      return { title: pageTitle, robots: { index: false, follow: true }, alternates: {} };
    }
    return {
      title: pageTitle,
      description: options.description ? t.meta[options.description] : undefined,
      alternates: localeAlternates(locale, path),
    };
  };
}
