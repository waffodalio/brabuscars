"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { pageKey } from "@/utils/listingPath";
import { hasInAppHistory, recordNavigation } from "@/utils/navigationHistory";

/**
 * Where "Back" leads when there is no in-app page to go back to (opened from
 * a link, a bookmark or a new tab): the parent section, else the home page.
 */
function parentOf(pathname: string, locale: string): string {
  const rest = pathname.slice(`/${locale}`.length); // e.g. "/annonces/12"
  if (rest.startsWith("/admin/annonces/")) return `/${locale}/admin/annonces`;
  if (rest.startsWith("/admin/ventes/")) return `/${locale}/admin/ventes`;
  if (rest.startsWith("/admin/")) return `/${locale}/admin`;
  if (rest.startsWith("/annonces/")) return `/${locale}/annonces`;
  if (rest === "/reinitialiser-mot-de-passe" || rest === "/mot-de-passe-oublie" || rest === "/inscription") {
    return `/${locale}/connexion`;
  }
  return `/${locale}`;
}

/** Key of the page on screen: its path (listing slug ignored) and its filters. */
function positionKey(pathname: string): string {
  return pageKey(pathname) + window.location.search;
}

/**
 * Keeps track of the navigations made inside the app (mounted once, in
 * `MainLayout`), so {@link BackButton} knows whether it can go back. A new
 * page starts at the top (so its Back button is in view); going back / forward
 * in the history returns to where that page was left — remembered here, as
 * the browser's own restoration often lands short while the page re-renders.
 * Renders nothing.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  // Compare with the last path seen (not "skip the first run"): effects may
  // run twice on mount in development.
  const last = useRef(pageKey(pathname));
  const fromHistory = useRef(false);
  /** Last scroll position of each page seen in this tab. */
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef<string | null>(null);

  useEffect(() => {
    currentKey.current = positionKey(window.location.pathname);
    const onPopState = () => {
      fromHistory.current = true;
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (currentKey.current) positions.current.set(currentKey.current, window.scrollY);
      });
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    // Only the words of a listing address changed: same page, not a navigation.
    const key = pageKey(pathname);
    if (last.current === key) return;
    last.current = key;
    currentKey.current = positionKey(pathname);
    recordNavigation();

    const saved = fromHistory.current ? positions.current.get(currentKey.current) : undefined;
    fromHistory.current = false;
    if (saved === undefined) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    // Wait until the page is tall enough again (a few frames at most).
    let tries = 0;
    let frame = 0;
    const restore = () => {
      const reachable = document.documentElement.scrollHeight - window.innerHeight >= saved;
      if (reachable || tries++ > 30) window.scrollTo({ top: saved, behavior: "instant" });
      else frame = requestAnimationFrame(restore);
    };
    frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}

/**
 * "← Back" at the top of every page but the home page: the previous page of
 * the app, or the parent section when the visitor arrived here directly.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useLanguage();

  if (pathname === `/${locale}` || pathname === `/${locale}/admin`) return null;

  function goBack() {
    if (hasInAppHistory()) router.back();
    else router.push(parentOf(pathname, locale));
  }

  return (
    <button type="button" className="chc-back" onClick={goBack}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {t.common.back}
    </button>
  );
}
