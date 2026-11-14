"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

/**
 * One line under a form that collects personal data (GDPR art. 13): what the
 * data is used for, and a link to the privacy policy (new tab, so a form
 * being filled in is not lost).
 */
export function PrivacyNotice({ kind, className = "" }: { kind: "account" | "reservation" | "contact"; className?: string }) {
  const { t, withLocale } = useLanguage();
  return (
    <p className={`small text-secondary mb-0 ${className}`}>
      {t.privacyNotice[kind]} {t.privacyNotice.more}{" "}
      <Link href={withLocale("/confidentialite")} target="_blank" rel="noopener">
        {t.privacyNotice.link}
      </Link>
      .
    </p>
  );
}
