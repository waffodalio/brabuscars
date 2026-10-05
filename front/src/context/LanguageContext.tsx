"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { fr, en, nl, type Dictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";

export type { Locale } from "@/i18n/locales";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, nl };

function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

/** Path segments after the leading `/<locale>`, e.g. "annonces/12". */
function pathAfterLocale(pathname: string): string {
  const segments = pathname.split("/");
  return segments.slice(2).join("/");
}

interface LanguageContextValue {
  locale: Locale;
  /** Active dictionary — e.g. `t.nav.listings`. */
  t: Dictionary;
  /** Prefixes an app-relative path (e.g. "/annonces") with the current locale. */
  withLocale: (path: string) => string;
  /** The current page's URL under a different locale, for the switcher. */
  pathFor: (locale: Locale) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * The locale is a URL segment (`/fr/...`, `/en/...`, `/nl/...`), not client state — it
 * is derived straight from the pathname on every render, so it can never go
 * stale after a navigation and is identical on the server and the client
 * (no cookie, no hydration mismatch to guard against).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const rest = pathAfterLocale(pathname);

  function withLocale(path: string): string {
    return `/${locale}${path}`;
  }

  function pathFor(target: Locale): string {
    return rest ? `/${target}/${rest}` : `/${target}`;
  }

  return (
    <LanguageContext.Provider
      value={{ locale, t: DICTIONARIES[locale], withLocale, pathFor }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
