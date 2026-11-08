import { describe, expect, it } from "vitest";
import {
  RESET_TOKEN_PATTERN,
  generateResetToken,
  hashResetToken,
  isSessionRevoked,
  passwordChangeTimestamp,
} from "./passwordReset";

describe("reset tokens", () => {
  it("generates distinct URL-safe 256-bit tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).toMatch(RESET_TOKEN_PATTERN);
    expect(b).toMatch(RESET_TOKEN_PATTERN);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically to 64 hex chars, never the token itself", () => {
    const token = generateResetToken();
    const hash = hashResetToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashResetToken(token)).toBe(hash);
    expect(hash).not.toContain(token);
  });
});

describe("passwordChangeTimestamp", () => {
  it("truncates to the second", () => {
    const at = passwordChangeTimestamp(new Date("2026-01-01T10:00:05.987Z"));
    expect(at.toISOString()).toBe("2026-01-01T10:00:05.000Z");
  });
});

describe("isSessionRevoked", () => {
  const changedAt = new Date("2026-01-01T10:00:05.000Z");
  const changedSec = changedAt.getTime() / 1000;

  it("keeps every session when the password never changed", () => {
    expect(isSessionRevoked(0, null)).toBe(false);
  });

  it("rejects a session issued before the change", () => {
    expect(isSessionRevoked(changedSec - 1, changedAt)).toBe(true);
  });

  it("keeps a session issued in the same second or later (the new one)", () => {
    expect(isSessionRevoked(changedSec, changedAt)).toBe(false);
    expect(isSessionRevoked(changedSec + 60, changedAt)).toBe(false);
  });

  it("rejects a token without iat once the password has changed", () => {
    expect(isSessionRevoked(undefined, changedAt)).toBe(true);
  });
});
