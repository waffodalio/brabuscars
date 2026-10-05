import { AppDataSource } from "../config/data-source";
import { RoleChangeLog } from "../entities/RoleChangeLog";
import type { ListRoleChangesQuery } from "../dto/user.dto";

/** Data-access layer for {@link RoleChangeLog}. */
export const roleChangeLogRepository = AppDataSource.getRepository(
  RoleChangeLog,
).extend({
  findRecent(query: ListRoleChangesQuery): Promise<RoleChangeLog[]> {
    return this.find({
      where: query.userId ? { targetUserId: query.userId } : {},
      order: { createdAt: "DESC", id: "DESC" },
      take: query.limit,
    });
  },
});
