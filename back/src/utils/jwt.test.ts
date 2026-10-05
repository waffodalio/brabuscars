import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  signAuthToken,
  signMfaPendingToken,
  verifyAuthToken,
  verifyMfaPendingToken,
} from "./jwt";

describe("signAuthToken / verifyAuthToken", () => {
  it("round-trips the user id and role", () => {
    const token = signAuthToken({ sub: 42, role: "admin" });
    const payload = verifyAuthToken(token);
    expect(payload).toEqual({ sub: 42, role: "admin", mfa: false });
  });

  it("carries the second-factor flag when set", () => {
    const token = signAuthToken({ sub: 42, role: "admin", mfa: true });
    expect(verifyAuthToken(token).mfa).toBe(true);
  });

  it("never accepts a 2FA-pending token as a session", () => {
    expect(() => verifyAuthToken(signMfaPendingToken(42))).toThrow();
  });

  it("signs with HS256 only, matching what verify accepts", () => {
    const token = signAuthToken({ sub: 1, role: "user" });
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString("utf8"),
    );
    expect(header.alg).toBe("HS256");
  });

  it("rejects a token signed with a non-pinned algorithm, even with the right secret", () => {
    const hs384Token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET as string,
      { algorithm: "HS384", subject: "1" },
    );
    expect(() => verifyAuthToken(hs384Token)).toThrow();
  });

  it("rejects a token carrying an unknown role", () => {
    const badToken = jwt.sign(
      { role: "super_villain" },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", subject: "1" },
    );
    expect(() => verifyAuthToken(badToken)).toThrow();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign(
      { role: "user" },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", subject: "1", expiresIn: -10 },
    );
    expect(() => verifyAuthToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});

describe("signMfaPendingToken / verifyMfaPendingToken", () => {
  it("round-trips the user id", () => {
    expect(verifyMfaPendingToken(signMfaPendingToken(7))).toBe(7);
  });

  it("rejects a session token", () => {
    const session = signAuthToken({ sub: 7, role: "admin" });
    expect(() => verifyMfaPendingToken(session)).toThrow();
  });
});
