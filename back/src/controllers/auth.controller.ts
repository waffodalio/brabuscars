import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { env, isGoogleAuthEnabled } from "../config/env";
import {
  googleCallbackQuerySchema,
  googleStartQuerySchema,
  loginSchema,
  mfaVerifySchema,
  registerSchema,
} from "../dto/auth.dto";
import { authService, type LoginOutcome } from "../services/auth.service";
import { mfaService } from "../services/mfa.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";
import {
  MFA_COOKIE,
  OAUTH_COOKIE,
  clearAuthCookies,
  clearMfaPendingCookie,
  clearOAuthStateCookie,
  setAuthCookies,
  setMfaPendingCookie,
  setOAuthStateCookie,
} from "../utils/cookies";
import {
  GoogleAuthError,
  buildAuthorizationUrl,
  createOAuthAttempt,
  exchangeCodeForIdToken,
  validateIdToken,
  type GoogleClientConfig,
} from "../utils/googleOAuth";
import {
  signOAuthStateToken,
  verifyMfaPendingToken,
  verifyOAuthStateToken,
  type OAuthStatePayload,
} from "../utils/jwt";

/** User id behind the 2FA-pending cookie, or 401 (missing / expired). */
function pendingMfaUserId(req: Request): number {
  const token = req.cookies?.[MFA_COOKIE];
  if (typeof token === "string" && token.length > 0) {
    try {
      return verifyMfaPendingToken(token);
    } catch {
      /* fall through */
    }
  }
  throw ApiError.unauthorized("Login session expired, please sign in again");
}

/** Google client settings, or 404 when the feature is not configured. */
function googleConfig(): GoogleClientConfig {
  if (!isGoogleAuthEnabled) {
    throw ApiError.notFound("Google sign-in is not enabled");
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID as string,
    clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  };
}

/** Reason codes the login page turns into a message (`?google=…`). */
type GoogleFailure = "cancelled" | "expired" | "failed" | "unverified" | "conflict";

/** Front-end URL (the CORS origin is the front's origin) for a locale path. */
function frontUrl(locale: string, path: string, query?: Record<string, string>): string {
  const url = new URL(`/${locale}${path}`, env.CORS_ORIGIN);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/** The attempt bound to this browser by the `/auth/google` step, if valid. */
function pendingOAuthAttempt(req: Request): OAuthStatePayload | null {
  const token = req.cookies?.[OAUTH_COOKIE];
  if (typeof token !== "string" || token.length === 0) return null;
  try {
    return verifyOAuthStateToken(token);
  } catch {
    return null;
  }
}

/**
 * Same outcome handling as the password login, but answered with a redirect
 * to the front: home with a session, or the login page for the 2FA step.
 */
function redirectAfterLogin(res: Response, outcome: LoginOutcome, locale: string): void {
  if (outcome.kind === "mfa") {
    setMfaPendingCookie(res, outcome.mfaToken);
    const step = outcome.enrollmentRequired ? "enroll" : "code";
    res.redirect(303, frontUrl(locale, "/connexion", { mfa: step }));
    return;
  }
  setAuthCookies(res, outcome.token);
  res.redirect(303, frontUrl(locale, "/"));
}

/**
 * HTTP layer for `/api/auth`. On register/login the JWT is placed in an
 * httpOnly cookie (never in the response body); a readable CSRF cookie is set
 * alongside. Accounts requiring 2FA get a short-lived httpOnly 2FA-pending
 * cookie at login instead, exchanged for the session by `/mfa/verify`.
 * `me` runs behind the `authenticate` middleware.
 */
export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const dto = registerSchema.parse(req.body);
    const { user, token } = await authService.register(dto);
    const csrfToken = setAuthCookies(res, token);
    res.status(201).json(success({ user, csrfToken }));
  },

  async login(req: Request, res: Response): Promise<void> {
    const dto = loginSchema.parse(req.body);
    const outcome = await authService.login(dto);
    if (outcome.kind === "mfa") {
      setMfaPendingCookie(res, outcome.mfaToken);
      res.status(200).json(
        success({
          mfaRequired: true,
          enrollmentRequired: outcome.enrollmentRequired,
        }),
      );
      return;
    }
    const csrfToken = setAuthCookies(res, outcome.token);
    res.status(200).json(success({ user: outcome.user, csrfToken }));
  },

  /** First-time 2FA setup: returns the secret / QR URI to scan. */
  async mfaSetup(req: Request, res: Response): Promise<void> {
    const enrollment = await mfaService.startEnrollment(pendingMfaUserId(req));
    res.status(200).json(success(enrollment));
  },

  /** Second step of login: a valid code opens the session. */
  async mfaVerify(req: Request, res: Response): Promise<void> {
    const userId = pendingMfaUserId(req);
    const { code } = mfaVerifySchema.parse(req.body);
    const { user, token, recoveryCodes } = await mfaService.verify(
      userId,
      code,
    );
    clearMfaPendingCookie(res);
    const csrfToken = setAuthCookies(res, token);
    res.status(200).json(success({ user, csrfToken, recoveryCodes }));
  },

  /** Sign-in methods available besides e-mail + password. */
  providers(_req: Request, res: Response): void {
    res.status(200).json(success({ google: isGoogleAuthEnabled }));
  },

  /**
   * "Sign in with Google", first leg: binds a fresh state / nonce / PKCE
   * verifier to this browser (signed httpOnly cookie) and redirects to Google.
   */
  googleStart(req: Request, res: Response): void {
    const config = googleConfig();
    const { locale } = googleStartQuerySchema.parse(req.query);
    const attempt = createOAuthAttempt();
    setOAuthStateCookie(res, signOAuthStateToken({ ...attempt, locale }));
    res.redirect(303, buildAuthorizationUrl(config, attempt, locale));
  },

  /**
   * Second leg, called by Google: checks `state` against the cookie (login
   * CSRF), exchanges the code, validates the ID token, then opens the session
   * (or the 2FA step). Always answers with a redirect to the front; failures
   * land on the login page with a reason code, never with internal details.
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    const config = googleConfig();
    const attempt = pendingOAuthAttempt(req);
    clearOAuthStateCookie(res);
    const locale = attempt?.locale ?? "fr";
    const fail = (reason: GoogleFailure) =>
      res.redirect(303, frontUrl(locale, "/connexion", { google: reason }));

    const query = googleCallbackQuerySchema.safeParse(req.query);
    if (!query.success) return fail("failed");
    if (query.data.error) return fail("cancelled");
    if (!attempt) return fail("expired");
    const { code, state } = query.data;
    if (!code || !state || !safeEqual(state, attempt.state)) {
      return fail("failed");
    }

    try {
      const idToken = await exchangeCodeForIdToken(config, code, attempt.codeVerifier);
      const identity = validateIdToken(idToken, {
        clientId: config.clientId,
        nonce: attempt.nonce,
      });
      const outcome = await authService.loginWithGoogle(identity);
      redirectAfterLogin(res, outcome, locale);
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        console.warn(`Google sign-in rejected: ${err.message}`);
        return fail(err.reason);
      }
      if (err instanceof ApiError && err.statusCode === 409) return fail("conflict");
      console.error("Google sign-in failed:", err);
      return fail("failed");
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json(success(user));
  },

  logout(_req: Request, res: Response): void {
    clearAuthCookies(res);
    clearMfaPendingCookie(res);
    res.status(204).send();
  },
};
