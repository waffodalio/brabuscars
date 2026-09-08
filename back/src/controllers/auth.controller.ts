import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../dto/auth.dto";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/auth`. `register` and `login` are public; `me`
 * runs behind the `authenticate` middleware.
 */
export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    res.status(201).json(success(result));
  },

  async login(req: Request, res: Response): Promise<void> {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    res.status(200).json(success(result));
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json(success(user));
  },
};
