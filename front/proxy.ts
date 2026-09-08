import { NextResponse, type NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

/** Origin of the backend API, allowed as a `connect-src` in the CSP. */
const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    ).origin;
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
    // everything except static assets and image optimizer output
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
