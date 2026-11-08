import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { env } from "../config/env";
import type {
  ForgotPasswordDto,
  FrontLocale,
  ResetPasswordDto,
} from "../dto/auth.dto";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { User } from "../entities/User";
import { passwordResetTokenRepository } from "../repositories/passwordResetToken.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { frontUrl } from "../utils/frontUrl";
import { hashPassword } from "../utils/password";
import {
  RESET_REQUEST_COOLDOWN_MS,
  RESET_TOKEN_TTL_MINUTES,
  generateResetToken,
  hashResetToken,
  passwordChangeTimestamp,
} from "../utils/passwordReset";
import { mailer } from "./mail/mailer";
import { passwordChangedEmail, passwordResetEmail } from "./mail/templates";

/** Front page the e-mailed link opens. */
export const RESET_PAGE_PATH = "/reinitialiser-mot-de-passe";

const INVALID_LINK = "Invalid or expired reset link";

/** Security notice after a change; a delivery failure never fails the change. */
function notifyPasswordChanged(user: User, locale: FrontLocale): void {
  mailer
    .send(
      passwordChangedEmail({
        to: user.email,
        firstName: user.firstName,
        locale,
        company: env.COMPANY_NAME,
        contact: env.COMPANY_EMAIL,
      }),
    )
    .catch((err) => {
      console.error("[mail] password-changed notice failed:", err);
    });
}

/**
 * "Forgot password" (e-mailed single-use link, offered on the login page).
 * A reset stamps `user.password_changed_at`, which revokes every session
 * issued before (see `authenticate`).
 */
export const passwordService = {
  /**
   * Issues a reset link and e-mails it. Silent on purpose — unknown e-mail,
   * cooldown not elapsed — so the public form never reveals whether an
   * account exists. Works for accounts created with Google too (lets them
   * set a password). The caller does not await it (constant response time).
   */
  async requestReset({ email, locale }: ForgotPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const latest = await passwordResetTokenRepository.findLatestForUser(user.id);
    if (latest && Date.now() - latest.createdAt.getTime() < RESET_REQUEST_COOLDOWN_MS) {
      return;
    }

    const token = generateResetToken();
    await AppDataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      // A new link replaces any previous one.
      await tokens.delete({ userId: user.id });
      await tokens.insert({
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
        usedAt: null,
      });
    });

    await mailer.send(
      passwordResetEmail({
        to: user.email,
        firstName: user.firstName,
        locale,
        company: env.COMPANY_NAME,
        link: frontUrl(locale, RESET_PAGE_PATH, { token }),
        ttlMinutes: RESET_TOKEN_TTL_MINUTES,
      }),
    );
  },

  /**
   * Sets a new password from a valid link. The token is consumed in the same
   * transaction as the password update (a link can't be used twice, even
   * concurrently). Opens no session: the user signs in again, admins through
   * their second factor as usual.
   */
  async resetPassword({ token, password, locale }: ResetPasswordDto): Promise<void> {
    const record = await passwordResetTokenRepository.findValidByHash(
      hashResetToken(token),
    );
    if (!record) throw ApiError.badRequest(INVALID_LINK);

    const user = await userRepository.findById(record.userId);
    if (!user) throw ApiError.badRequest(INVALID_LINK);

    const passwordHash = await hashPassword(password);
    await AppDataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      const consumed = await tokens.update(
        { id: record.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      if (consumed.affected !== 1) throw ApiError.badRequest(INVALID_LINK);

      await manager.getRepository(User).update(
        { id: user.id },
        { passwordHash, passwordChangedAt: passwordChangeTimestamp() },
      );
      await tokens.delete({ userId: user.id, id: Not(record.id) });
    });

    notifyPasswordChanged(user, locale);
  },
};
