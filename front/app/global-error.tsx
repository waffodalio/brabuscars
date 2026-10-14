"use client";

import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Last-resort boundary for an error in the locale layout itself (providers,
 * fonts…). It replaces the whole document, so none of the app's contexts are
 * available: the text is static, French first with an English line.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="d-flex align-items-center justify-content-center min-vh-100 p-3">
        <title>BrabusCars — erreur</title>
        <main className="text-center" role="alert" style={{ maxWidth: 480 }}>
          <h1 className="h3 mb-3">Une erreur est survenue</h1>
          <p className="text-secondary mb-1">
            Le site n&apos;a pas pu s&apos;afficher. Réessayez dans quelques instants.
          </p>
          <p className="text-secondary small mb-4">
            Something went wrong. Please try again in a moment.
          </p>
          <div className="d-flex justify-content-center flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              Réessayer / Try again
            </button>
            {/* Full reload on purpose: the app shell itself failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn-outline-secondary">
              Accueil / Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
