import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { authRateLimiter, mfaRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/auth`
 *   POST /register     create an account, sets the auth + CSRF cookies   (rate limited)
 *   POST /login        check the password; sets the auth + CSRF cookies, or —
 *                      for accounts needing 2FA (admins) — a 2FA-pending
 *                      cookie and `{ mfaRequired, enrollmentRequired }`  (rate limited)
 *   POST /mfa/setup    first-time 2FA: returns the TOTP secret / QR URI   (2FA-pending)
 *   POST /mfa/verify   TOTP or recovery code → sets the auth + CSRF cookies (2FA-pending)
 *   POST /logout       clears the auth, CSRF and 2FA-pending cookies
 *   GET  /me           current user (requires a valid session)
 *
 * `register` / `login` are exempt from the CSRF check (the visitor has no
 * session yet); they are protected by rate limiting, SameSite cookies and
 * strict CORS. `/mfa/*` are CSRF-checked and rate limited.
 */
export const authRouter = Router();

authRouter.post("/register", authRateLimiter, authController.register);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.post("/mfa/setup", mfaRateLimiter, authController.mfaSetup);
authRouter.post("/mfa/verify", mfaRateLimiter, authController.mfaVerify);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
