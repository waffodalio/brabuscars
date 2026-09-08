import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { authRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/auth`
 *   POST /register   create an account, sets the auth + CSRF cookies   (rate limited)
 *   POST /login      authenticate, sets the auth + CSRF cookies        (rate limited)
 *   POST /logout     clears the auth + CSRF cookies
 *   GET  /me         current user (requires a valid session)
 *
 * `register` / `login` are exempt from the CSRF check (the visitor has no
 * session yet); they are protected by rate limiting, SameSite cookies and
 * strict CORS.
 */
export const authRouter = Router();

authRouter.post("/register", authRateLimiter, authController.register);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
