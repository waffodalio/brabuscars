"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { useLanguage } from "@/context/LanguageContext";

function CookieIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 8.66 15c-.38.06-.77.1-1.16.1a4 4 0 0 1-4-4c0-.3.03-.6.08-.88A3.5 3.5 0 0 1 12 5.5c.3 0 .58.03.86.08A4 4 0 0 1 17 2.34 10 10 0 0 0 12 2Z"
        fill="currentColor"
      />
      <circle cx="9" cy="10" r="1.1" fill="var(--chc-cookie-hole, var(--bs-card-bg))" />
      <circle cx="14.5" cy="9" r="0.9" fill="var(--chc-cookie-hole, var(--bs-card-bg))" />
      <circle cx="9.5" cy="15" r="1" fill="var(--chc-cookie-hole, var(--bs-card-bg))" />
      <circle cx="15" cy="14.5" r="0.9" fill="var(--chc-cookie-hole, var(--bs-card-bg))" />
    </svg>
  );
}

/**
 * Floating GDPR-style cookie consent bubble (bottom-right corner, never
 * blocks the page). Once a choice is made it collapses into a small
 * persistent launcher (`.chc-cookie-fab`) so preferences stay one click away
 * — mirrors the "reopen" affordance of the footer link, without needing the
 * footer.
 */
export function CookieConsentBanner() {
  const { bannerOpen, consent, acceptAll, rejectAll, save, reopen } =
    useCookieConsent();
  const { t } = useLanguage();
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);

  // Reopening (e.g. via the footer link or the launcher) should reflect the
  // saved choice, not whatever was left over from the previous time.
  useEffect(() => {
    if (bannerOpen) {
      setCustomizing(false);
      setAnalytics(consent?.analytics ?? false);
    }
  }, [bannerOpen, consent]);

  if (!bannerOpen) {
    if (consent === null) return null;
    return (
      <button
        type="button"
        className="chc-cookie-fab"
        onClick={reopen}
        aria-label={t.cookies.reopenAria}
      >
        <CookieIcon />
      </button>
    );
  }

  return (
    <div className="chc-cookie-bubble" role="dialog" aria-live="polite">
      <div className="chc-cookie-bubble__head">
        <span className="chc-cookie-bubble__icon">
          <CookieIcon />
        </span>
        <p className="small mb-0">{t.cookies.message}</p>
        <button
          type="button"
          className="chc-cookie-bubble__close"
          onClick={rejectAll}
          aria-label={t.cookies.close}
        >
          ✕
        </button>
      </div>

      {customizing && (
        <div className="chc-cookie-bubble__options">
          <div className="chc-cookie-bubble__category">
            <Form.Check
              type="switch"
              id="cookie-essential"
              label={`${t.cookies.essential} — ${t.cookies.essentialDesc}`}
              checked
              disabled
              className="small mb-0"
            />
            <div className="chc-cookie-names">
              <span className="chc-cookie-chip" title={t.cookies.cookieToken}>
                chcars_token
              </span>
              <span className="chc-cookie-chip" title={t.cookies.cookieCsrf}>
                chcars_csrf
              </span>
              <span className="chc-cookie-chip" title={t.cookies.cookieTheme}>
                chcars_theme
              </span>
            </div>
          </div>

          <div className="chc-cookie-bubble__category">
            <Form.Check
              type="switch"
              id="cookie-analytics"
              label={`${t.cookies.analytics} — ${t.cookies.analyticsDesc}`}
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="small mb-0"
            />
            <div className="chc-cookie-names">
              <span className="chc-cookie-chip" title={t.cookies.cookieVisitor}>
                chcars_visitor_id
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mt-3">
        {customizing ? (
          <Button size="sm" variant="primary" onClick={() => save({ analytics })}>
            {t.cookies.save}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setCustomizing(true)}
            >
              {t.cookies.customize}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={rejectAll}>
              {t.cookies.rejectAll}
            </Button>
            <Button size="sm" variant="primary" onClick={acceptAll}>
              {t.cookies.acceptAll}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
