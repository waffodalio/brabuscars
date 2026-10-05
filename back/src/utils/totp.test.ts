import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  generateTotpSecret,
  hotp,
  verifyTotp,
} from "./totp";

// Shared secret of the RFC 4226 (appendix D) and RFC 6238 (appendix B) vectors.
const RFC_SECRET = Buffer.from("12345678901234567890", "ascii");
const RFC_SECRET_B32 = base32Encode(RFC_SECRET);

describe("base32", () => {
  it("encodes the RFC secret", () => {
    expect(RFC_SECRET_B32).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  it("round-trips a generated secret", () => {
    const secret = generateTotpSecret();
    expect(base32Decode(secret)).toHaveLength(20);
    expect(base32Encode(base32Decode(secret))).toBe(secret);
  });
});

describe("hotp", () => {
  it("matches the RFC 4226 test vectors", () => {
    const expected = ["755224", "287082", "359152", "969429", "338314"];
    expected.forEach((code, counter) => {
      expect(hotp(RFC_SECRET, counter)).toBe(code);
    });
  });
});

describe("verifyTotp", () => {
  // T = 59 s → step 1 (RFC 6238 vector 94287082, truncated to 6 digits).
  const nowMs = 59_000;

  it("accepts the current code and returns its step", () => {
    expect(verifyTotp(RFC_SECRET_B32, "287082", { nowMs })).toBe(1);
  });

  it("tolerates one step of drift either way", () => {
    expect(verifyTotp(RFC_SECRET_B32, "755224", { nowMs })).toBe(0);
    expect(verifyTotp(RFC_SECRET_B32, "359152", { nowMs })).toBe(2);
  });

  it("rejects codes outside the window", () => {
    expect(verifyTotp(RFC_SECRET_B32, "969429", { nowMs })).toBeNull();
  });

  it("refuses a step already used (replay)", () => {
    expect(
      verifyTotp(RFC_SECRET_B32, "287082", { nowMs, lastUsedStep: 1 }),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(verifyTotp(RFC_SECRET_B32, "28708", { nowMs })).toBeNull();
    expect(verifyTotp(RFC_SECRET_B32, "abcdef", { nowMs })).toBeNull();
  });
});

describe("buildOtpauthUri", () => {
  it("builds a standard otpauth URI", () => {
    const uri = buildOtpauthUri("CHCars", "a@b.fr", "ABC");
    expect(uri).toMatch(/^otpauth:\/\/totp\/CHCars%3Aa%40b\.fr\?/);
    expect(uri).toContain("secret=ABC");
    expect(uri).toContain("issuer=CHCars");
  });
});
