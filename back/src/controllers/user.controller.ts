import type { Request, Response } from "express";
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from "../dto/user.dto";
import { userService } from "../services/user.service";
import { actorOf } from "../utils/actor";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/users`. The whole router is super-admin only
 * (route middleware).
 */
export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listUsersQuerySchema.parse(req.query);
    const users = await userService.list(query);
    res.status(200).json(success(users));
  },

  async setRole(req: Request, res: Response): Promise<void> {
    const { id } = userIdParamSchema.parse(req.params);
    const dto = updateUserRoleSchema.parse(req.body);
    const user = await userService.setRole(id, dto, actorOf(req));
    res.status(200).json(success(user));
  },
};
