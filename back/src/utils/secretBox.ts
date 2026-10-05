import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env";

/**
 * Authenticated encryption (AES-256-GCM) for small secrets stored in the
 * database — the TOTP secrets. The key comes from `MFA_ENCRYPTION_KEY`, so a
 * database dump alone is not enough to generate valid codes.
 *
 * Format: `v1.<iv>.<tag>.<ciphertext>` (base64url parts).
 */
const VERSION = "v1";
const key = Buffer.from(env.MFA_ENCRYPTION_KEY, "hex");

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unsupported encrypted secret format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
