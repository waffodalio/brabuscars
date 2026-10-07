import type { LoginDto, RegisterDto } from "../dto/auth.dto";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../utils/password";
import { isAdminRole, type User } from "../entities/User";
import { mfaService } from "./mfa.service";
import { signAuthToken, signMfaPendingToken } from "../utils/jwt";
import { toPublicUser, type PublicUser } from "../utils/publicUser";
import type { GoogleIdentity } from "../utils/googleOAuth";

export interface AuthResult {
  user: PublicUser;
  token: string;
}

/** Login either opens a session or asks for the second factor. */
export type LoginOutcome =
  | ({ kind: "session" } & AuthResult)
  | { kind: "mfa"; mfaToken: string; enrollmentRequired: boolean };

/**
 * Accounts that need a second factor (admins, or any account with 2FA
 * enabled) get no session yet: a 2FA-pending outcome, finished through
 * `mfaService`. Everyone else gets a session token.
 */
async function openSession(user: User): Promise<LoginOutcome> {
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
}

/** First / last name from the Google profile, within the column limits. */
function namesFrom(identity: GoogleIdentity): { firstName: string; lastName: string } {
  const firstName =
    identity.givenName ?? identity.name ?? identity.email.split("@")[0];
  return {
    firstName: firstName.slice(0, 100),
    lastName: (identity.familyName ?? "").slice(0, 100),
  };
}

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
    // Accounts created with Google have no password: same dummy comparison.
    const passwordMatches = await verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    // Same error whether the email is unknown, the account has no password,
    // or the password is wrong.
    if (!user?.passwordHash || !passwordMatches) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    return openSession(user);
  },

  /**
   * "Sign in with Google" (identity already validated, e-mail verified by
   * Google). Finds the account by its Google id; otherwise links the existing
   * account with the same e-mail; otherwise creates a `user` account without
   * password. Admins still go through the 2FA step.
   */
  async loginWithGoogle(identity: GoogleIdentity): Promise<LoginOutcome> {
    let user = await userRepository.findByGoogleSub(identity.sub);

    if (!user) {
      const existing = await userRepository.findByEmail(identity.email);
      if (existing?.googleSub) {
        // Same e-mail, but already linked to a different Google account.
        throw ApiError.conflict("This email address is linked to another Google account");
      }
      if (existing) {
        existing.googleSub = identity.sub;
        user = await userRepository.save(existing);
      } else {
        user = await userRepository.save(
          userRepository.create({
            email: identity.email,
            passwordHash: null,
            googleSub: identity.sub,
            ...namesFrom(identity),
            role: "user",
          }),
        );
      }
    }

    return openSession(user);
  },

  async getCurrentUser(id: number): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw ApiError.unauthorized("Account no longer exists");
    }
    return toPublicUser(user);
  },
};
