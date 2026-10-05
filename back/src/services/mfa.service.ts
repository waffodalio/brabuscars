import { createHash, randomBytes } from "node:crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { env } from "../config/env";
import { UserMfa } from "../entities/UserMfa";
import { UserRecoveryCode } from "../entities/UserRecoveryCode";
import { userMfaRepository } from "../repositories/userMfa.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { signAuthToken } from "../utils/jwt";
import { toPublicUser, type PublicUser } from "../utils/publicUser";
import { decryptSecret, encryptSecret } from "../utils/secretBox";
import {
  base32Encode,
  buildOtpauthUri,
  generateTotpSecret,
  verifyTotp,
} from "../utils/totp";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RECOVERY_CODE_COUNT = 10;

export interface MfaEnrollment {
  /** `otpauth://` URI to render as a QR code. */
  otpauthUri: string;
  /** Same secret in base32, for manual entry in the authenticator app. */
  secret: string;
}

export interface MfaVerifyResult {
  user: PublicUser;
  token: string;
  /** Plain recovery codes — only returned once, when 2FA gets activated. */
  recoveryCodes?: string[];
}

function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Uppercase, without spaces or dashes — how codes are hashed and compared. */
function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

/** `ABCDE-FGHIJ` — 50 bits of entropy, base32 (no 0/1/8/9 ambiguity). */
function generateRecoveryCode(): string {
  const raw = base32Encode(randomBytes(7)).slice(0, 10);
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

async function loadAccount(userId: number) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }
  return user;
}

/**
 * TOTP second factor. Called once the password has been checked (the caller
 * holds a 2FA-pending token): first-time enrollment, then code verification
 * that opens the real session.
 */
export const mfaService = {
  async isEnabled(userId: number): Promise<boolean> {
    const mfa = await userMfaRepository.findByUserId(userId);
    return Boolean(mfa?.enabledAt);
  },

  /**
   * Generates (or regenerates, while still pending) the TOTP secret. Refused
   * once 2FA is active: replacing the secret would bypass the second factor.
   */
  async startEnrollment(userId: number): Promise<MfaEnrollment> {
    const user = await loadAccount(userId);
    const existing = await userMfaRepository.findByUserId(userId);
    if (existing?.enabledAt) {
      throw ApiError.conflict("Two-factor authentication is already enabled");
    }

    const secret = generateTotpSecret();
    await userMfaRepository.save({
      userId,
      secretEncrypted: encryptSecret(secret),
      enabledAt: null,
      lastUsedStep: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    return {
      otpauthUri: buildOtpauthUri(env.MFA_ISSUER, user.email, secret),
      secret,
    };
  },

  /**
   * Checks a 6-digit TOTP code — or, once 2FA is active, a recovery code —
   * and returns a full (2FA-flagged) session token. The first valid code
   * activates 2FA and returns fresh recovery codes. Five wrong codes in a row
   * lock the account's second factor for 15 minutes.
   */
  async verify(userId: number, rawCode: string): Promise<MfaVerifyResult> {
    const user = await loadAccount(userId);
    const mfa = await userMfaRepository.findByUserId(userId);
    if (!mfa) {
      throw ApiError.badRequest("Two-factor setup required");
    }
    if (mfa.lockedUntil && mfa.lockedUntil.getTime() > Date.now()) {
      throw ApiError.tooManyRequests(
        "Too many invalid codes, please try again later",
      );
    }

    const code = normalizeCode(rawCode);
    const enrolling = !mfa.enabledAt;
    let accepted = false;

    if (/^\d{6}$/.test(code)) {
      const step = verifyTotp(decryptSecret(mfa.secretEncrypted), code, {
        lastUsedStep: mfa.lastUsedStep,
      });
      if (step !== null) {
        // Conditional update: two concurrent requests can't both use a step.
        const result = await userMfaRepository
          .createQueryBuilder()
          .update(UserMfa)
          .set({ lastUsedStep: step })
          .where("user_id = :userId", { userId })
          .andWhere("(last_used_step IS NULL OR last_used_step < :step)", {
            step,
          })
          .execute();
        accepted = result.affected === 1;
      }
    } else if (!enrolling) {
      const result = await AppDataSource.getRepository(UserRecoveryCode).update(
        { userId, codeHash: hashRecoveryCode(code), usedAt: IsNull() },
        { usedAt: new Date() },
      );
      accepted = result.affected === 1;
    }

    if (!accepted) {
      const failedAttempts = mfa.failedAttempts + 1;
      const locked = failedAttempts >= MAX_FAILED_ATTEMPTS;
      await userMfaRepository.update(
        { userId },
        {
          failedAttempts: locked ? 0 : failedAttempts,
          lockedUntil: locked ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      );
      throw ApiError.badRequest("Invalid code");
    }

    let recoveryCodes: string[] | undefined;
    await AppDataSource.transaction(async (manager) => {
      await manager
        .getRepository(UserMfa)
        .update(
          { userId },
          {
            failedAttempts: 0,
            lockedUntil: null,
            ...(enrolling ? { enabledAt: new Date() } : {}),
          },
        );
      if (enrolling) {
        recoveryCodes = Array.from(
          { length: RECOVERY_CODE_COUNT },
          generateRecoveryCode,
        );
        const codes = manager.getRepository(UserRecoveryCode);
        await codes.delete({ userId });
        await codes.insert(
          recoveryCodes.map((plain) => ({
            userId,
            codeHash: hashRecoveryCode(normalizeCode(plain)),
          })),
        );
      }
    });

    return {
      user: toPublicUser(user),
      token: signAuthToken({ sub: user.id, role: user.role, mfa: true }),
      recoveryCodes,
    };
  },

  /** Removes 2FA from an account (lost device) — next login re-enrolls. */
  async reset(userId: number): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      await manager.getRepository(UserRecoveryCode).delete({ userId });
      await manager.getRepository(UserMfa).delete({ userId });
    });
  },
};
