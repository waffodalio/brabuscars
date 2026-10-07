"use client";

import Link from "next/link";
import Dropdown from "react-bootstrap/Dropdown";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALES } from "@/i18n/locales";

/** Navbar language picker: globe pill showing the current locale, opening a
 * menu that links to the same page under another locale
 * (`/fr/annonces` ⇄ `/en/annonces` ⇄ `/nl/annonces`). */
export function LanguageSwitcher() {
  const { locale, pathFor, t } = useLanguage();

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant=""
        className="chc-lang-toggle"
        aria-label={`${t.language.selector} — ${t.language[locale]}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M1.5 8h13M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.7 5.2 8S6 12.5 8 14.5" />
        </svg>
        <span>{locale.toUpperCase()}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="chc-lang-menu">
        {LOCALES.map((value) => (
          <Dropdown.Item
            key={value}
            as={Link}
            href={pathFor(value)}
            active={value === locale}
            aria-current={value === locale ? "true" : undefined}
            className="chc-lang-item"
          >
            <span className="chc-lang-code">{value.toUpperCase()}</span>
            <span className="flex-grow-1">{t.language[value]}</span>
            {value === locale && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8.5l3.2 3L13 4.5" />
              </svg>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
