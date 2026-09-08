import type { Request, RequestHandler } from "express";
import type { UserRole } from "../entities/User";
import { ApiError } from "../utils/ApiError";
import { verifyAuthToken } from "../utils/jwt";
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
 * Requires a valid auth token (cookie or bearer) and attaches the decoded
 * principal to `req.user`. Rejects with 401 otherwise.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = readToken(req);
  if (!token) {
    throw ApiError.unauthorized("Authentication required");
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }
};

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
