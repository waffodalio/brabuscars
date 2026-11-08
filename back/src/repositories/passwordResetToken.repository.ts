import { IsNull, MoreThan } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PasswordResetToken } from "../entities/PasswordResetToken";

/** Data-access layer for {@link PasswordResetToken}. */
export const passwordResetTokenRepository = AppDataSource.getRepository(
  PasswordResetToken,
).extend({
  /** Unused, unexpired token matching this hash, if any. */
  findValidByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.findOneBy({
      tokenHash,
      usedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    });
  },

  /** Most recent token issued to the account (used or not). */
  findLatestForUser(userId: number): Promise<PasswordResetToken | null> {
    return this.findOne({ where: { userId }, order: { createdAt: "DESC" } });
  },
});
