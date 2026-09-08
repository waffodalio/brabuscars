import { z } from "zod";
import { ASSIGNABLE_ROLES, USER_ROLES } from "../entities/User";

/** `:id` path parameter, coerced from string to a positive integer. */
export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  search: z.string().trim().min(1).optional(),
});

/**
 * A super admin may only set a user to `user` or `admin` — the `super_admin`
 * role is never granted through the API (script / DB only).
 */
export const updateUserRoleSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
