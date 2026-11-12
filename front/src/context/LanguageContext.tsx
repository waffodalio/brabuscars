"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { fr, en, nl, type Dictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/locales";

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

  // Stable until the locale changes: effects depending on it don't re-run
  // on every navigation, and consumers skip needless re-renders.
  const withLocale = useCallback((path: string) => `/${locale}${path}`, [locale]);
  const pathFor = useCallback(
    (target: Locale) => (rest ? `/${target}/${rest}` : `/${target}`),
    [rest],
  );
  // Remember the language actually shown (switcher, shared link…) for the
  // next visit to an address without one, e.g. `brabuscars.be` (`proxy.ts`).
  // Set here rather than in the proxy, which also sees link prefetches.
  useEffect(() => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, t: DICTIONARIES[locale], withLocale, pathFor }),
    [locale, withLocale, pathFor],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
