import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { authRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/auth`
 *   POST /register   create an account, returns { user, token }   (rate limited)
 *   POST /login      authenticate, returns { user, token }        (rate limited)
 *   GET  /me         current user (requires a valid bearer token)
 */
export const authRouter = Router();

authRouter.post("/register", authRateLimiter, authController.register);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.get("/me", authenticate, authController.me);
