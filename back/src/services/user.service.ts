import type { ListUsersQuery, UpdateUserRoleDto } from "../dto/user.dto";
import type { AssignableRole } from "../entities/User";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import type { Actor } from "../utils/actor";
import { toPublicUser, type PublicUser } from "../utils/publicUser";

/**
 * User administration — reserved to super admins (enforced by the route
 * middleware). A super admin can list every account and switch an account
 * between `user` and `admin`.
 */
export const userService = {
  async list(query: ListUsersQuery): Promise<PublicUser[]> {
    const users = await userRepository.findAllFiltered(query);
    return users.map(toPublicUser);
  },

  async setRole(
    targetId: number,
    dto: UpdateUserRoleDto,
    actor: Actor,
  ): Promise<PublicUser> {
    if (targetId === actor.id) {
      throw ApiError.badRequest("You cannot change your own role");
    }

    const target = await userRepository.findById(targetId);
    if (!target) {
      throw ApiError.notFound(`User ${targetId} not found`);
    }
    if (target.role === "super_admin") {
      throw ApiError.forbidden("A super admin's role cannot be changed here");
    }

    target.role = dto.role as AssignableRole;
    await userRepository.save(target);
    return toPublicUser(target);
  },
};
