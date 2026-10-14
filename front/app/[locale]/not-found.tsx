"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Translated 404 inside the site's shell: rendered for `notFound()` calls and,
 * through the `[...rest]` catch-all, for any unknown URL under a locale.
 */
export default function LocaleNotFound() {
  const { t, withLocale } = useLanguage();

  return (
    <section className="text-center py-5">
      <p className="display-4 fw-bold text-secondary mb-2">404</p>
      <h1 className="h3 mb-3">{t.errors.notFoundTitle}</h1>
      <p className="text-secondary mb-4">{t.errors.notFoundText}</p>
      <Link href={withLocale("/")} className="btn btn-primary">
        {t.errors.backHome}
      </Link>
    </section>
  );
}
