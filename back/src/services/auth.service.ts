import type { LoginDto, RegisterDto } from "../dto/auth.dto";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../utils/password";
import { isAdminRole } from "../entities/User";
import { mfaService } from "./mfa.service";
import { signAuthToken, signMfaPendingToken } from "../utils/jwt";
import { toPublicUser, type PublicUser } from "../utils/publicUser";

export interface AuthResult {
  user: PublicUser;
  token: string;
}

/** Login either opens a session or asks for the second factor. */
export type LoginOutcome =
  | ({ kind: "session" } & AuthResult)
  | { kind: "mfa"; mfaToken: string; enrollmentRequired: boolean };

/**
 * Registration, login and "who am I" logic. Passwords are hashed with bcrypt;
 * a successful register or login returns a signed JWT alongside the public
 * user representation.
 */
export const authService = {
  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await userRepository.existsByEmail(dto.email)) {
      throw ApiError.conflict("This email address is already registered");
    }

    const user = userRepository.create({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: "user",
    });
    const saved = await userRepository.save(user);

    return {
      user: toPublicUser(saved),
      token: signAuthToken({ sub: saved.id, role: saved.role }),
    };
  },

  /**
   * Checks the password. Accounts that need a second factor (admins, or any
   * account with 2FA enabled) get no session here: the caller receives a
   * 2FA-pending outcome and finishes through `mfaService`.
   */
  async login(dto: LoginDto): Promise<LoginOutcome> {
    const user = await userRepository.findByEmail(dto.email);
    // Always run a bcrypt comparison (against a dummy hash when the email is
    // unknown) so response time doesn't reveal whether the account exists.
    const passwordMatches = await verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    // Same error whether the email is unknown or the password is wrong.
    if (!user || !passwordMatches) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const mfaEnabled = await mfaService.isEnabled(user.id);
    if (mfaEnabled || isAdminRole(user.role)) {
      return {
        kind: "mfa",
        mfaToken: signMfaPendingToken(user.id),
        enrollmentRequired: !mfaEnabled,
      };
    }

    return {
      kind: "session",
      user: toPublicUser(user),
      token: signAuthToken({ sub: user.id, role: user.role }),
    };
  },

  async getCurrentUser(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.unauthorized("Account no longer exists");
    }
    return toPublicUser(user);
  },
};
