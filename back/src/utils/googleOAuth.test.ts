import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  GoogleAuthError,
  buildAuthorizationUrl,
  createOAuthAttempt,
  validateIdToken,
} from "./googleOAuth";

const CLIENT_ID = "client-123.apps.googleusercontent.com";
const NONCE = "nonce-abc";
const NOW = 1_800_000_000;

/** Unsigned token with the given claims (only the payload is read). */
function idToken(overrides: Record<string, unknown> = {}): string {
  const claims = {
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    sub: "1234567890",
    email: "Jane.Doe@Gmail.com",
    email_verified: true,
    given_name: "Jane",
    family_name: "Doe",
    nonce: NONCE,
    iat: NOW - 10,
    exp: NOW + 3600,
    ...overrides,
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256" })}.${encode(claims)}.signature`;
}

const expected = { clientId: CLIENT_ID, nonce: NONCE };

describe("validateIdToken", () => {
  it("returns the identity with a lower-cased e-mail", () => {
    expect(validateIdToken(idToken(), expected, NOW)).toEqual({
      sub: "1234567890",
      email: "jane.doe@gmail.com",
      givenName: "Jane",
      familyName: "Doe",
      name: undefined,
    });
  });

  it("accepts the issuer without scheme", () => {
    expect(() =>
      validateIdToken(idToken({ iss: "accounts.google.com" }), expected, NOW),
    ).not.toThrow();
  });

  it.each([
    ["another issuer", { iss: "https://evil.example" }],
    ["another audience", { aud: "someone-else" }],
    ["an expired token", { exp: NOW - 120 }],
    ["a token from the future", { iat: NOW + 600 }],
    ["a wrong nonce", { nonce: "replayed" }],
    ["no subject", { sub: "" }],
    ["no e-mail", { email: undefined }],
  ])("rejects %s", (_label, overrides) => {
    expect(() => validateIdToken(idToken(overrides), expected, NOW)).toThrow(
      GoogleAuthError,
    );
  });

  it("requires azp when there are several audiences", () => {
    const token = idToken({ aud: [CLIENT_ID, "other"], azp: "other" });
    expect(() => validateIdToken(token, expected, NOW)).toThrow(GoogleAuthError);
    const ok = idToken({ aud: [CLIENT_ID, "other"], azp: CLIENT_ID });
    expect(() => validateIdToken(ok, expected, NOW)).not.toThrow();
  });

  it("flags an unverified e-mail with its own reason", () => {
    try {
      validateIdToken(idToken({ email_verified: false }), expected, NOW);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(GoogleAuthError);
      expect((err as GoogleAuthError).reason).toBe("unverified");
    }
  });

  it("rejects malformed tokens", () => {
    expect(() => validateIdToken("not-a-jwt", expected, NOW)).toThrow(GoogleAuthError);
    expect(() => validateIdToken("a.%%%.c", expected, NOW)).toThrow(GoogleAuthError);
  });
});

describe("buildAuthorizationUrl", () => {
  it("sends state, nonce and the S256 PKCE challenge", () => {
    const attempt = createOAuthAttempt();
    const url = new URL(
      buildAuthorizationUrl(
        { clientId: CLIENT_ID, clientSecret: "secret", redirectUri: "https://x.test/cb" },
        attempt,
        "fr",
      ),
    );
    const params = url.searchParams;
    expect(url.origin).toBe("https://accounts.google.com");
    expect(params.get("client_id")).toBe(CLIENT_ID);
    expect(params.get("redirect_uri")).toBe("https://x.test/cb");
    expect(params.get("scope")).toBe("openid email profile");
    expect(params.get("state")).toBe(attempt.state);
    expect(params.get("nonce")).toBe(attempt.nonce);
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toBe(
      createHash("sha256").update(attempt.codeVerifier).digest("base64url"),
    );
    // The client secret never goes through the browser.
    expect(url.toString()).not.toContain("secret");
  });

  it("generates a different attempt each time", () => {
    const a = createOAuthAttempt();
    const b = createOAuthAttempt();
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
  });
});
