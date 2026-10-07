export type UserRole = "user" | "admin" | "super_admin";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

/** Register / login response — the JWT lives in an httpOnly cookie, not here. */
export interface AuthResult {
  user: AuthUser;
  /** Double-submit CSRF token; also set as a readable cookie. */
  csrfToken: string;
}

/** Login response for accounts that need the second factor (admins). */
export interface MfaChallenge {
  mfaRequired: true;
  /** True on the very first login: 2FA must be set up first. */
  enrollmentRequired: boolean;
}

/** `POST /auth/mfa/setup` — secret to register in the authenticator app. */
export interface MfaEnrollment {
  otpauthUri: string;
  secret: string;
}

/** `POST /auth/mfa/verify` — recovery codes only when 2FA gets activated. */
export interface MfaVerifyResult extends AuthResult {
  recoveryCodes?: string[];
}

/** What a password login leads to. */
export type LoginStep =
  | { mfaRequired: false }
  | { mfaRequired: true; enrollmentRequired: boolean };

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  firstName: string;
  lastName: string;
}

/** Entry of the role-change audit trail (`GET /users/role-changes`). */
export interface RoleChange {
  id: number;
  targetUserId: number | null;
  targetEmail: string;
  actorUserId: number | null;
  actorEmail: string;
  oldRole: UserRole;
  newRole: UserRole;
  createdAt: string;
}

/** `GET /auth/providers` — sign-in methods available besides the password. */
export interface AuthProviders {
  google: boolean;
}

/** Reason codes the API appends to `/connexion?google=…` after a failure. */
export const GOOGLE_ERRORS = [
  "cancelled",
  "expired",
  "unverified",
  "conflict",
  "failed",
] as const;
export type GoogleError = (typeof GOOGLE_ERRORS)[number];
