"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CookieConsent {
  /** Internal audience-measurement cookie (`chcars_visitor_id`). */
  analytics: boolean;
}

interface CookieConsentContextValue {
  /** `null` until the visitor has made (or restored) a choice. */
  consent: CookieConsent | null;
  /** Whether the consent banner should currently be shown. */
  bannerOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (consent: CookieConsent) => void;
  /** Reopens the banner so the choice can be changed later (footer link). */
  reopen: () => void;
}

const CONSENT_COOKIE = "chcars_cookie_consent";
const VISITOR_COOKIE = "chcars_visitor_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function readConsentCookie(): CookieConsent | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return { analytics: parsed.analytics === true };
  } catch {
    return null;
  }
}

function ensureVisitorCookie() {
  if (readCookie(VISITOR_COOKIE)) return;
  writeCookie(VISITOR_COOKIE, crypto.randomUUID(), ONE_YEAR);
}

/**
 * GDPR-style cookie consent: essential cookies (auth/CSRF, language, theme)
 * are always on and never gated here. The only opt-in category is an
 * anonymous internal traceability cookie (`chcars_visitor_id`) used for
 * audience measurement — no third-party trackers are involved.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const saved = readConsentCookie();
    setConsent(saved);
    setBannerOpen(saved === null);
    if (saved?.analytics) ensureVisitorCookie();
  }, []);

  function persist(next: CookieConsent) {
    setConsent(next);
    writeCookie(CONSENT_COOKIE, JSON.stringify(next), ONE_YEAR);
    if (next.analytics) {
      ensureVisitorCookie();
    } else {
      deleteCookie(VISITOR_COOKIE);
    }
    setBannerOpen(false);
  }

  const value: CookieConsentContextValue = {
    consent,
    bannerOpen,
    acceptAll: () => persist({ analytics: true }),
    rejectAll: () => persist({ analytics: false }),
    save: persist,
    reopen: () => setBannerOpen(true),
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider",
    );
  }
  return context;
}
