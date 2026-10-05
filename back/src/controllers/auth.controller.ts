import type { Request, Response } from "express";
import { loginSchema, mfaVerifySchema, registerSchema } from "../dto/auth.dto";
import { authService } from "../services/auth.service";
import { mfaService } from "../services/mfa.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";
import {
  MFA_COOKIE,
  clearAuthCookies,
  clearMfaPendingCookie,
  setAuthCookies,
  setMfaPendingCookie,
} from "../utils/cookies";
import { verifyMfaPendingToken } from "../utils/jwt";

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
