"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALES } from "@/i18n/locales";

/** Compact FR/EN/NL pill switch used in the navbar — links to the same page
 * under another locale (`/fr/annonces` ⇄ `/en/annonces` ⇄ `/nl/annonces`). */
export function LanguageSwitcher() {
  const { locale, pathFor, t } = useLanguage();

  return (
    <div className="chc-lang-switch" role="group" aria-label={t.language.selector}>
      {LOCALES.map((value) => (
        <Link
          key={value}
          href={pathFor(value)}
          className={`chc-lang-btn${value === locale ? " active" : ""}`}
          aria-pressed={value === locale}
        >
          {value.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
