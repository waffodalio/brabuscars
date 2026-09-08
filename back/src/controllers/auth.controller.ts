import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../dto/auth.dto";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies";

/**
 * HTTP layer for `/api/auth`. On register/login the JWT is placed in an
 * httpOnly cookie (never in the response body); a readable CSRF cookie is set
 * alongside. `me` runs behind the `authenticate` middleware.
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
    const { user, token } = await authService.login(dto);
    const csrfToken = setAuthCookies(res, token);
    res.status(200).json(success({ user, csrfToken }));
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
    res.status(204).send();
  },
};
