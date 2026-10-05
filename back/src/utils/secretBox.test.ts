import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./secretBox";

describe("secretBox", () => {
  it("round-trips a secret without exposing it", () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(encrypted.startsWith("v1.")).toBe(true);
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects a tampered payload", () => {
    const parts = encryptSecret("secret").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});
