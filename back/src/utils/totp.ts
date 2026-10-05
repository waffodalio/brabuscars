import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Minimal TOTP implementation (RFC 6238 over RFC 4226 HOTP): SHA-1, 6 digits,
 * 30-second steps — the defaults every authenticator app supports.
 */
const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/\s/g, "").replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 character");
    value = ((value << 5) | index) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh 160-bit secret, base32-encoded (what authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP value for `counter` (RFC 4226 dynamic truncation). */
export function hotp(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Current 30-second time step. */
export function currentStep(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000 / STEP_SECONDS);
}

export interface VerifyTotpOptions {
  /** Last step already accepted for this secret: it and earlier are refused. */
  lastUsedStep?: number | null;
  nowMs?: number;
  /** Steps of clock drift tolerated either way (default 1). */
  window?: number;
}

/**
 * Checks a 6-digit code against the secret, tolerating one step of clock
 * drift either way. Returns the matching time step, or `null`. Steps at or
 * before `lastUsedStep` are refused so a code cannot be replayed.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  options: VerifyTotpOptions = {},
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretBase32);
  const now = currentStep(options.nowMs);
  const window = options.window ?? 1;
  const given = Buffer.from(code);

  for (let step = now - window; step <= now + window; step++) {
    if (step < 0) continue;
    if (options.lastUsedStep != null && step <= options.lastUsedStep) continue;
    if (timingSafeEqual(Buffer.from(hotp(secret, step)), given)) return step;
  }
  return null;
}

/** `otpauth://` URI encoded in the enrollment QR code. */
export function buildOtpauthUri(
  issuer: string,
  account: string,
  secretBase32: string,
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
