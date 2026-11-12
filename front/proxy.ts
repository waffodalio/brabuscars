import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "@/i18n/locales";

const isProduction = process.env.NODE_ENV === "production";

/** The locale at the start of the path (`/nl/annonces` → "nl"), or `null`. */
function localeOfPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : null;
}

/**
 * Language for an address without one: the last language used on this
 * browser (cookie), else the browser's preferred supported language, else
 * French.
 */
function preferredLocale(request: NextRequest): Locale {
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value ?? "";
  if (isLocale(remembered)) return remembered;
  return negotiateLocale(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;
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
  const locale = localeOfPath(pathname);
  if (!locale) {
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
