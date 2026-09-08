import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * A valid bcrypt hash of a random string, computed once at startup. Used to
 * spend the same time verifying a password when the account does not exist,
 * so login timing cannot be used to enumerate registered emails.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  `dummy:${Math.random()}:${Date.now()}`,
  SALT_ROUNDS,
);

/** Hashes a plaintext password for storage. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Verifies a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
