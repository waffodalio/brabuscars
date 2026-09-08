import type { RequestHandler } from "express";
import type { UserRole } from "../entities/User";
import { ApiError } from "../utils/ApiError";
import { verifyAuthToken } from "../utils/jwt";

const BEARER_PREFIX = "Bearer ";

/**
 * Requires a valid `Authorization: Bearer <token>` header and attaches the
 * decoded principal to `req.user`. Rejects with 401 otherwise.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    throw ApiError.unauthorized("Missing bearer token");
  }

  try {
    const payload = verifyAuthToken(header.slice(BEARER_PREFIX.length));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
};

/**
 * Restricts a route to the given roles. Must be chained after `authenticate`.
 */
export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden("Insufficient permissions");
    }
    next();
  };

/** Require an authenticated administrator. Spread into a route's handlers. */
export const adminOnly: RequestHandler[] = [authenticate, authorize("admin")];
