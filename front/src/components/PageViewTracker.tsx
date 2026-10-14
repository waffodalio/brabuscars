"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { analyticsService } from "@/services/analyticsService";

/**
 * Reports each public page displayed to the internal audience measurement —
 * only once the visitor has accepted the measurement cookie, and never for
 * the back-office. Renders nothing; failures are ignored so measurement can
 * never disturb browsing.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { consent } = useCookieConsent();
  const allowed = consent?.analytics === true;
  /** Last path sent: avoids a double count when React re-runs the effect. */
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!allowed || pathname.split("/")[2] === "admin") return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    analyticsService.trackPageView(pathname).catch(() => {
      /* measurement is best-effort */
    });
  }, [pathname, allowed]);

  return null;
}
