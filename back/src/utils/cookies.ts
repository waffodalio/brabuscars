import { randomBytes } from "node:crypto";
import ms from "ms";
import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env";
import { MFA_PENDING_TTL_SECONDS } from "./jwt";

export const AUTH_COOKIE = "chcars_token";
export const CSRF_COOKIE = "chcars_csrf";
/** httpOnly cookie carrying the "password OK, 2FA pending" token. */
export const MFA_COOKIE = "chcars_mfa";
/** Header the frontend echoes the CSRF cookie value into. */
export const CSRF_HEADER = "x-csrf-token";

/** Lifetime shared by both cookies, derived from the JWT expiry. */
const MAX_AGE_MS = (() => {
  const parsed = ms(env.JWT_EXPIRES_IN as ms.StringValue);
  return typeof parsed === "number" && parsed > 0 ? parsed : ms("1d");
})();

const baseOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: isProduction,
  maxAge: MAX_AGE_MS,
};

/**
 * Writes the auth cookie (httpOnly — unreadable by JS) and the CSRF cookie
 * (readable, so the SPA can echo it back in a header). Same value binding is
 * what the double-submit CSRF check verifies.
 */
export function setAuthCookies(res: Response, token: string): string {
  const csrfToken = randomBytes(24).toString("base64url");
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, httpOnly: true });
  res.cookie(CSRF_COOKIE, csrfToken, { ...baseOptions, httpOnly: false });
  return csrfToken;
}

/**
 * Password accepted, second factor pending: drops any previous session and
 * sets the short-lived httpOnly 2FA-pending cookie instead. The CSRF cookie
 * is left untouched (the `/auth/mfa/*` calls are CSRF-checked).
 */
export function setMfaPendingCookie(res: Response, token: string): void {
  res.clearCookie(AUTH_COOKIE, {
    path: "/",
    sameSite: "lax",
    secure: isProduction,
    httpOnly: true,
  });
  res.cookie(MFA_COOKIE, token, {
    path: "/",
    sameSite: "strict",
    secure: isProduction,
    httpOnly: true,
    maxAge: MFA_PENDING_TTL_SECONDS * 1000,
  });
}

export function clearMfaPendingCookie(res: Response): void {
  res.clearCookie(MFA_COOKIE, {
    path: "/",
    sameSite: "strict",
    secure: isProduction,
    httpOnly: true,
  });
}

export function clearAuthCookies(res: Response): void {
  const clearOptions: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: isProduction,
  };
  res.clearCookie(AUTH_COOKIE, { ...clearOptions, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...clearOptions, httpOnly: false });
}
