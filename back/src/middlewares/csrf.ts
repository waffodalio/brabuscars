import { randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { CSRF_COOKIE, CSRF_HEADER } from "../utils/cookies";
import { isProduction } from "../config/env";
import { ApiError } from "../utils/ApiError";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Paths (relative to the API prefix) exempt from the CSRF check: the visitor
 * has no session yet, so there is nothing to forge.
 */
const EXEMPT_PATHS = new Set(["/auth/login", "/auth/register"]);

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/**
 * Ensures every response carries a readable CSRF cookie, minting one when the
 * visitor doesn't have it yet (e.g. before their first login).
 */
export const ensureCsrfCookie: RequestHandler = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    res.cookie(CSRF_COOKIE, randomBytes(24).toString("base64url"), {
      path: "/",
      sameSite: "lax",
      secure: isProduction,
      httpOnly: false,
    });
  }
  next();
};

/**
 * Double-submit CSRF check: state-changing requests must send the CSRF cookie
 * value back in the `X-CSRF-Token` header. Safe methods pass through.
 */
export const verifyCsrf: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method) || EXEMPT_PATHS.has(req.path)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (
    !cookieToken ||
    !headerToken ||
    !safeEqual(String(cookieToken), String(headerToken))
  ) {
    throw ApiError.forbidden("Invalid or missing CSRF token");
  }
  next();
};
