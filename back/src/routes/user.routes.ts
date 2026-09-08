import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { superAdminOnly } from "../middlewares/authenticate";

/**
 * `/api/users` — super admin only.
 *   GET   /            list accounts (optional ?role= &search=)
 *   PATCH /:id/role    set an account's role to `user` or `admin`
 */
export const userRouter = Router();

userRouter.use(...superAdminOnly);

userRouter.get("/", userController.list);
userRouter.patch("/:id/role", userController.setRole);
