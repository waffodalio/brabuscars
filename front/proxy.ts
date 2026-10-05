import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

const isProduction = process.env.NODE_ENV === "production";

/** True for `/fr`, `/fr/...`, `/en/...`, `/nl/...` (any supported locale). */
function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

/** Picks a locale from the `Accept-Language` header, falling back to French. */
function preferredLocale(request: NextRequest): (typeof LOCALES)[number] {
  const header = request.headers.get("accept-language") ?? "";
  const first = header.split(",")[0]?.split("-")[0]?.toLowerCase();
  return (LOCALES as readonly string[]).includes(first ?? "")
    ? (first as (typeof LOCALES)[number])
    : DEFAULT_LOCALE;
}

/**
 * Origin of the backend API, allowed as a `connect-src` in the CSP. Empty when
 * the API is same-origin (relative URL like `/api` behind the reverse proxy,
 * see `deploy/`), since `'self'` already covers it.
 */
const apiOrigin = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  if (apiUrl.startsWith("/")) return "";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:4000";
  }
})();

/**
 * Proxy — adds a Content-Security-Policy to every document response.
 *
 * In production the policy is strict and nonce-based (`strict-dynamic`);
 * Next.js picks up the nonce from the request header and stamps it onto its
 * own scripts. In development it is relaxed so Turbopack HMR keeps working.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname}`;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());

  const scriptSrc = isProduction
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline' 'unsafe-eval'`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https: ${apiOrigin}`,
    `font-src 'self' data:`,
    `frame-src https://www.google.com`,
    `connect-src 'self' ${apiOrigin}${isProduction ? "" : " ws: wss:"}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Pages only: never Next internals (`/_next/*` — static assets, image
    // optimizer, dev HMR websocket `/_next/webpack-hmr` — nor the dev
    // overlay's `/__nextjs*` endpoints) and never files (path with a dot).
    // Redirecting the HMR socket to `/fr/_next/…` broke live updates in dev.
    "/((?!_next/|__nextjs|.*\\..*).*)",
  ],
};
