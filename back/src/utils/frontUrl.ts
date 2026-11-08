import { env } from "../config/env";

/**
 * Absolute front-end URL for a locale path (the CORS origin is the front's
 * origin), e.g. `frontUrl("fr", "/connexion", { mfa: "code" })`.
 */
export function frontUrl(
  locale: string,
  path: string,
  query?: Record<string, string>,
): string {
  const url = new URL(`/${locale}${path}`, env.CORS_ORIGIN);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
