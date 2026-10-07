import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { USER_ROLES, type UserRole } from "../entities/User";

/** Only HMAC-SHA256 is accepted — prevents algorithm-confusion attacks. */
const ALGORITHM = "HS256" as const;

/** `typ` claim of the short-lived "password OK, 2FA pending" token. */
const MFA_PENDING_TYPE = "mfa_pending";
/** Time allowed to type the 2FA code (or finish enrollment) after the password. */
export const MFA_PENDING_TTL_SECONDS = 5 * 60;

export interface AuthTokenPayload {
  /** User id. */
  sub: number;
  role: UserRole;
  /** True when the session was opened with a second factor. */
  mfa?: boolean;
}

/** Signs a short-lived authentication token for the given user. */
export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: String(payload.sub),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  const claims = payload.mfa
    ? { role: payload.role, mfa: true }
    : { role: payload.role };
  return jwt.sign(claims, env.JWT_SECRET, options);
}

/**
 * Verifies a session token and returns its payload. Throws (JsonWebTokenError
 * / TokenExpiredError) when the token is missing, malformed, expired — or is a
 * 2FA-pending token, which never grants a session.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ALGORITHM],
  });

  if (
    typeof decoded === "string" ||
    decoded.typ !== undefined ||
    typeof decoded.sub !== "string" ||
    !USER_ROLES.includes(decoded.role as UserRole)
  ) {
    throw new jwt.JsonWebTokenError("Malformed token payload");
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role as UserRole,
    mfa: decoded.mfa === true,
  };
}

/** Token proving the password step succeeded; only valid on `/auth/mfa/*`. */
export function signMfaPendingToken(userId: number): string {
  return jwt.sign({ typ: MFA_PENDING_TYPE }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: String(userId),
    expiresIn: MFA_PENDING_TTL_SECONDS,
  });
}

/** Returns the user id of a valid 2FA-pending token, or throws. */
export function verifyMfaPendingToken(token: string): number {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ALGORITHM],
  });
  if (
    typeof decoded === "string" ||
    decoded.typ !== MFA_PENDING_TYPE ||
    typeof decoded.sub !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Malformed token payload");
  }
  return Number(decoded.sub);
}

/** `typ` claim of the "Sign in with Google" round-trip token. */
const OAUTH_STATE_TYPE = "oauth_state";
/** Time allowed to pick a Google account before the attempt expires. */
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export interface OAuthStatePayload {
  state: string;
  nonce: string;
  codeVerifier: string;
  /** Front-end locale to return to (`fr`, `en`, `nl`). */
  locale: string;
}

/**
 * Signed (tamper-proof) carrier for the OAuth `state`, `nonce` and PKCE
 * verifier between `/auth/google` and its callback; lives in an httpOnly
 * cookie, never grants a session.
 */
export function signOAuthStateToken(payload: OAuthStatePayload): string {
  return jwt.sign(
    {
      typ: OAUTH_STATE_TYPE,
      st: payload.state,
      nn: payload.nonce,
      cv: payload.codeVerifier,
      lc: payload.locale,
    },
    env.JWT_SECRET,
    { algorithm: ALGORITHM, expiresIn: OAUTH_STATE_TTL_SECONDS },
  );
}

/** Returns the payload of a valid OAuth round-trip token, or throws. */
export function verifyOAuthStateToken(token: string): OAuthStatePayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ALGORITHM],
  });
  if (
    typeof decoded === "string" ||
    decoded.typ !== OAUTH_STATE_TYPE ||
    typeof decoded.st !== "string" ||
    typeof decoded.nn !== "string" ||
    typeof decoded.cv !== "string" ||
    typeof decoded.lc !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Malformed token payload");
  }
  return {
    state: decoded.st,
    nonce: decoded.nn,
    codeVerifier: decoded.cv,
    locale: decoded.lc,
  };
}
