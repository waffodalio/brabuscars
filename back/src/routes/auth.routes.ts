import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";

/**
 * `/api/auth`
 *   POST /register   create an account, returns { user, token }
 *   POST /login      authenticate, returns { user, token }
 *   GET  /me         current user (requires a valid bearer token)
 */
export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authenticate, authController.me);
