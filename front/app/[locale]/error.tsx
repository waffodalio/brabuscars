"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Error boundary for every page under `/[locale]`: an unexpected rendering
 * error shows this translated message inside the site's shell (navbar,
 * footer, theme) instead of Next's default page. Errors in the locale layout
 * itself fall through to `app/global-error.tsx`.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t, withLocale } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="text-center py-5" role="alert">
      <h1 className="h3 mb-3">{t.errors.pageTitle}</h1>
      <p className="text-secondary mb-4">{t.errors.pageText}</p>
      <div className="d-flex justify-content-center flex-wrap gap-2">
        <Button onClick={() => retry()}>{t.errors.retry}</Button>
        <Link href={withLocale("/")} className="btn btn-outline-secondary">
          {t.errors.backHome}
        </Link>
      </div>
    </section>
  );
}
