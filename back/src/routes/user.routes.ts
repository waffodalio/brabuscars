import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { superAdminOnly } from "../middlewares/authenticate";

/**
 * `/api/users` — super admin only.
 *   GET   /            list accounts (optional ?role= &search=)
 *   GET   /role-changes  audit trail of role changes (optional ?userId= &limit=)
 *   PATCH /:id/role    set an account's role to `user` or `admin`
 *   DELETE /:id        delete a client (`user`) account — never an admin
 */
export const userRouter = Router();

userRouter.use(...superAdminOnly);

userRouter.get("/", userController.list);
userRouter.get("/role-changes", userController.listRoleChanges);
userRouter.patch("/:id/role", userController.setRole);
userRouter.delete("/:id", userController.remove);
