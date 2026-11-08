import { createHash, randomBytes } from "node:crypto";

/** How long a "forgot password" link stays valid. */
export const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * Minimum delay between two reset e-mails for the same account: stops
 * anyone from flooding a mailbox through the public form.
 */
export const RESET_REQUEST_COOLDOWN_MS = 2 * 60 * 1000;

/** 256-bit random token, URL-safe — goes into the e-mailed link only. */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database stores (and looks up): the token's SHA-256, hex. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Shape of a token produced by {@link generateResetToken}. */
export const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Password-change timestamp truncated to the second: JWT `iat` claims have
 * second precision, so a session opened right after the change (same
 * second) must not be considered older than it.
 */
export function passwordChangeTimestamp(now = new Date()): Date {
  return new Date(Math.floor(now.getTime() / 1000) * 1000);
}

/**
 * True when a session issued at `issuedAtSeconds` (JWT `iat`) predates the
 * last password change, i.e. must be rejected.
 */
export function isSessionRevoked(
  issuedAtSeconds: number | undefined,
  passwordChangedAt: Date | null,
): boolean {
  if (!passwordChangedAt) return false;
  if (issuedAtSeconds === undefined) return true;
  return issuedAtSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}
