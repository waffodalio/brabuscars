import { AppDataSource } from "../config/data-source";
import { UserMfa } from "../entities/UserMfa";

/** Data-access layer for {@link UserMfa}. */
export const userMfaRepository = AppDataSource.getRepository(UserMfa).extend({
  findByUserId(userId: number): Promise<UserMfa | null> {
    return this.findOneBy({ userId });
  },
});
