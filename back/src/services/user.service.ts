import { AppDataSource } from "../config/data-source";
import type {
  ListRoleChangesQuery,
  ListUsersQuery,
  UpdateUserRoleDto,
} from "../dto/user.dto";
import { Listing } from "../entities/Listing";
import { RoleChangeLog } from "../entities/RoleChangeLog";
import { User, type AssignableRole } from "../entities/User";
import { roleChangeLogRepository } from "../repositories/roleChangeLog.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import type { Actor } from "../utils/actor";
import { toPublicUser, type PublicUser } from "../utils/publicUser";
import {
  toRoleChangeResponse,
  type RoleChangeResponse,
} from "../utils/roleChangeResponse";

/**
 * User administration — reserved to super admins (enforced by the route
 * middleware). A super admin can list every account and switch an account
 * between `user` and `admin`. Every effective role change is recorded in the
 * `role_change_log` audit table, atomically with the change itself. A super
 * admin can also delete client (`user`) accounts — never an administrator.
 */

/**
 * Loads the account a super admin wants to act on, enforcing the shared
 * guards: never oneself, never another super admin.
 */
async function findManageableTarget(
  targetId: number,
  actor: Actor,
  selfMessage: string,
): Promise<User> {
  if (targetId === actor.id) {
    throw ApiError.badRequest(selfMessage);
  }
  const target = await userRepository.findById(targetId);
  if (!target) {
    throw ApiError.notFound(`User ${targetId} not found`);
  }
  if (target.role === "super_admin") {
    throw ApiError.forbidden("A super admin account cannot be managed here");
  }
  return target;
}

export interface DeleteUserResult {
  /** Listings moved to the deleting super admin. */
  reassignedListings: number;
}

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
    const target = await findManageableTarget(
      targetId,
      actor,
      "You cannot change your own role",
    );

    const newRole = dto.role as AssignableRole;
    if (target.role === newRole) {
      // Nothing to change, nothing to log.
      return toPublicUser(target);
    }

    const actorUser = await userRepository.findById(actor.id);
    if (!actorUser) {
      throw ApiError.unauthorized("Account no longer exists");
    }

    const oldRole = target.role;
    target.role = newRole;
    await AppDataSource.transaction(async (manager) => {
      await manager.getRepository(User).save(target);
      await manager.getRepository(RoleChangeLog).insert({
        targetUserId: target.id,
        targetEmail: target.email,
        actorUserId: actorUser.id,
        actorEmail: actorUser.email,
        oldRole,
        newRole,
      });
    });
    return toPublicUser(target);
  },

  /**
   * Deletes a client (`user`) account; administrators cannot be deleted.
   * Favourites are removed by the DB cascade and the role-change history is
   * kept (ids set to NULL, emails preserved). A former admin may still be
   * the seller of listings: those belong to the dealership, so they are
   * reassigned to the deleting super admin rather than lost.
   */
  async remove(targetId: number, actor: Actor): Promise<DeleteUserResult> {
    const target = await findManageableTarget(
      targetId,
      actor,
      "You cannot delete your own account",
    );
    if (target.role !== "user") {
      throw ApiError.forbidden("Only client (user) accounts can be deleted");
    }

    return AppDataSource.transaction(async (manager) => {
      const { affected } = await manager
        .getRepository(Listing)
        .update({ sellerId: target.id }, { sellerId: actor.id });
      await manager.getRepository(User).delete({ id: target.id });
      return { reassignedListings: affected ?? 0 };
    });
  },

  async listRoleChanges(
    query: ListRoleChangesQuery,
  ): Promise<RoleChangeResponse[]> {
    const entries = await roleChangeLogRepository.findRecent(query);
    return entries.map(toRoleChangeResponse);
  },
};
