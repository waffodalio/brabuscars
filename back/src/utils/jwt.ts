import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../entities/User";

export interface AuthTokenPayload {
  /** User id. */
  sub: number;
  role: UserRole;
}

/** Signs a short-lived authentication token for the given user. */
export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    subject: String(payload.sub),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ role: payload.role }, env.JWT_SECRET, options);
}

/**
 * Verifies a token and returns its payload. Throws (JsonWebTokenError /
 * TokenExpiredError) when the token is missing, malformed or expired.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    (decoded.role !== "user" && decoded.role !== "admin")
  ) {
    throw new jwt.JsonWebTokenError("Malformed token payload");
  }

  return { sub: Number(decoded.sub), role: decoded.role };
}
