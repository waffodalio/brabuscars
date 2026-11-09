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

/**
 * Keeps track of the navigations made inside the app (mounted once, in
 * `MainLayout`), so {@link BackButton} knows whether it can go back. A new
 * page starts at the top (so its Back button is in view); going back / forward
 * in the history keeps the browser's restored position. Renders nothing.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  // Compare with the last path seen (not "skip the first run"): effects may
  // run twice on mount in development.
  const last = useRef(pageKey(pathname));
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Only the words of a listing address changed: same page, not a navigation.
    const key = pageKey(pathname);
    if (last.current === key) return;
    last.current = key;
    recordNavigation();
    if (!fromHistory.current) window.scrollTo({ top: 0 });
    fromHistory.current = false;
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
