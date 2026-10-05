"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { googleMapsDirectionsUrl } from "@/utils/mapLinks";

/** 24×24 stroke icon (Feather-style), inherits `currentColor`. */
function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  instagram: (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </Icon>
  ),
  facebook: (
    <Icon>
      <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />
    </Icon>
  ),
  pin: (
    <Icon>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
  ),
  phone: (
    <Icon>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </Icon>
  ),
  mail: (
    <Icon>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </Icon>
  ),
  clock: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  arrowUp: (
    <Icon size={16}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Icon>
  ),
};

function FooterHeading({ children }: { children: ReactNode }) {
  return <h2 className="chc-footer-heading">{children}</h2>;
}

/** Pages where the call-to-action band would distract (the footer itself is
 * not rendered in the admin, see `MainLayout`). */
const CTA_HIDDEN_SECTIONS = new Set(["connexion", "inscription"]);

/**
 * Site footer of the client-facing pages: call-to-action band (hidden on
 * the auth pages; a button pointing at the current page is dropped), brand + social links, navigation and
 * account columns, the dealership's contact details, and a bottom bar with
 * the copyright, cookie preferences and a back-to-top button. Social icons
 * only appear for the networks configured on the backend
 * (`COMPANY_INSTAGRAM_URL` / `COMPANY_FACEBOOK_URL`).
 */
export function AppFooter() {
  const company = useCompany();
  const { user, initializing } = useAuth();
  const { reopen } = useCookieConsent();
  const { t, withLocale } = useLanguage();
  const name = company?.name ?? "CHCars";
  // First segment after the locale: "" (home), "annonces", "contact", …
  const section = usePathname().split("/")[2] ?? "";
  const showCta = !CTA_HIDDEN_SECTIONS.has(section);
  const ctaLinks = [
    { section: "annonces", label: t.footer.ctaListings, variant: "btn-light" },
    { section: "contact", label: t.footer.ctaContact, variant: "btn-outline-light" },
  ].filter((link) => link.section !== section);

  const socials = [
    { url: company?.instagramUrl, label: t.footer.instagram(name), icon: icons.instagram },
    { url: company?.facebookUrl, label: t.footer.facebook(name), icon: icons.facebook },
  ].filter((social): social is typeof social & { url: string } =>
    Boolean(social.url),
  );

  return (
    <footer className="chc-footer mt-auto">
      <div className="container" style={{ maxWidth: 1140 }}>
        {showCta && (
          <section className="chc-footer-cta">
            <div className="chc-footer-cta-text">
              <h2 className="h4 fw-bold mb-2">{t.footer.ctaTitle}</h2>
              <p className="mb-0 opacity-75">{t.footer.ctaText}</p>
            </div>
            <div className="chc-footer-cta-actions">
              {ctaLinks.map((link) => (
                <Link
                  key={link.section}
                  href={withLocale(`/${link.section}`)}
                  className={`btn btn-lg ${link.variant} fw-semibold`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="row g-4 g-lg-5 py-5">
          <div className="col-12 col-lg-4">
            <Link href={withLocale("/")} className="chc-brand fs-4 text-decoration-none">
              {name}
            </Link>
            <p className="text-secondary small mt-3 mb-4">{t.footer.tagline}</p>
            {socials.length > 0 && (
              <>
                <FooterHeading>{t.footer.followUs}</FooterHeading>
                <ul className="list-unstyled d-flex gap-2 mb-0">
                  {socials.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chc-footer-social"
                        aria-label={`${social.label} ${t.footer.newTab}`}
                        title={social.label}
                      >
                        {social.icon}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <nav className="col-6 col-lg-2" aria-label={t.footer.navTitle}>
            <FooterHeading>{t.footer.navTitle}</FooterHeading>
            <ul className="chc-footer-links">
              <li><Link href={withLocale("/")}>{t.footer.home}</Link></li>
              <li><Link href={withLocale("/annonces")}>{t.footer.listings}</Link></li>
              <li><Link href={withLocale("/contact")}>{t.footer.contact}</Link></li>
            </ul>
          </nav>

          <nav className="col-6 col-lg-2" aria-label={t.footer.accountTitle}>
            <FooterHeading>{t.footer.accountTitle}</FooterHeading>
            {!initializing && (
              <ul className="chc-footer-links">
                {user ? (
                  <li><Link href={withLocale("/favoris")}>{t.footer.favorites}</Link></li>
                ) : (
                  <>
                    <li><Link href={withLocale("/connexion")}>{t.footer.login}</Link></li>
                    <li><Link href={withLocale("/inscription")}>{t.footer.register}</Link></li>
                  </>
                )}
              </ul>
            )}
          </nav>

          <div className="col-12 col-lg-4">
            <FooterHeading>{t.footer.findUsTitle}</FooterHeading>
            {company && (
              <ul className="chc-footer-contact">
                <li>
                  {icons.pin}
                  <span>
                    {company.address}
                    <br />
                    {company.postalCode} {company.city}, {company.country}
                    <br />
                    <a
                      href={googleMapsDirectionsUrl(company)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="small fw-semibold"
                    >
                      {t.footer.directions} →
                    </a>
                  </span>
                </li>
                <li>
                  {icons.phone}
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{company.phone}</a>
                </li>
                <li>
                  {icons.mail}
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </li>
                <li>
                  {icons.clock}
                  <span>{company.hours}</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="chc-footer-bottom">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span>{t.footer.rights(new Date().getFullYear())}</span>
            <button type="button" onClick={reopen} className="chc-footer-linkbtn">
              {t.footer.manageCookies}
            </button>
          </div>
          <button
            type="button"
            className="chc-footer-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {icons.arrowUp}
            {t.footer.backToTop}
          </button>
        </div>
      </div>
    </footer>
  );
}
