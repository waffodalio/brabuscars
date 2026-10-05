import type { Request, RequestHandler } from "express";
import { isAdminRole, type UserRole } from "../entities/User";
import { userRepository } from "../repositories/user.repository";
import type { AuthUser } from "../types/express";
import { ApiError } from "../utils/ApiError";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/jwt";
import { AUTH_COOKIE } from "../utils/cookies";

const BEARER_PREFIX = "Bearer ";

/** Role hierarchy: a higher rank includes every lower-ranked permission. */
const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
};

/**
 * Reads the JWT from the httpOnly auth cookie, falling back to an
 * `Authorization: Bearer <token>` header (useful for tooling / tests).
 */
function readToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  const header = req.headers.authorization;
  if (header?.startsWith(BEARER_PREFIX)) {
    return header.slice(BEARER_PREFIX.length);
  }
  return undefined;
}

/**
 * Resolves the principal behind a token. The role is re-read from the
 * database on every request rather than trusted from the JWT, so a role
 * change (e.g. an admin demoted by a super admin) takes effect immediately
 * instead of when the token expires. Returns `null` for an invalid or expired
 * token, an account that no longer exists, or an admin session opened
 * without the second factor (e.g. a token issued before the account was
 * promoted, or before 2FA became mandatory): the admin must sign in again.
 */
async function resolvePrincipal(token: string): Promise<AuthUser | null> {
  let payload: AuthTokenPayload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    return null;
  }
  const user = await userRepository.findById(payload.sub);
  if (!user || (isAdminRole(user.role) && !payload.mfa)) return null;
  return { id: user.id, role: user.role };
}

/**
 * Requires a valid auth token (cookie or bearer) and attaches the principal
 * to `req.user`. Rejects with 401 otherwise.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) {
    throw ApiError.unauthorized("Authentication required");
  }

  const principal = await resolvePrincipal(token);
  if (!principal) {
    throw ApiError.unauthorized("Invalid or expired session");
  }
  req.user = principal;
  next();
};

/**
 * Attaches `req.user` when a valid token is present but never rejects: mounted
 * on endpoints that stay public yet expose more to administrators (e.g.
 * `GET /listings`, where only an admin sees non-published adverts). An
 * invalid or missing token simply leaves the caller anonymous.
 */
export const optionalAuthenticate: RequestHandler = async (
  req,
  _res,
  next,
) => {
  const token = readToken(req);
  if (token) {
    const principal = await resolvePrincipal(token);
    if (principal) req.user = principal;
  }
  next();
};

/** True when `role` exists and outranks (or equals) `minRole`. */
export const hasRole = (
  role: UserRole | undefined,
  minRole: UserRole,
): boolean => role !== undefined && ROLE_RANK[role] >= ROLE_RANK[minRole];

/**
 * Requires the authenticated user to hold at least `minRole`. Must be chained
 * after `authenticate`.
 */
export const authorize =
  (minRole: UserRole): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || ROLE_RANK[req.user.role] < ROLE_RANK[minRole]) {
      throw ApiError.forbidden("Insufficient permissions");
    }
    next();
  };

/** Require at least an administrator (`admin` or `super_admin`). */
export const adminOnly: RequestHandler[] = [authenticate, authorize("admin")];

/** Require a super administrator. */
export const superAdminOnly: RequestHandler[] = [
  authenticate,
  authorize("super_admin"),
];
