import { createHash, randomBytes } from "node:crypto";

/**
 * "Sign in with Google" — OpenID Connect authorization-code flow with PKCE,
 * implemented without a dependency (like `totp.ts`).
 *
 * The ID token is received directly from Google's token endpoint over TLS
 * (server-to-server, authenticated with the client secret), so per OpenID
 * Connect Core §3.1.3.7 its signature does not need to be re-verified; its
 * claims (issuer, audience, expiry, nonce, verified e-mail) still are.
 */

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
/** Tolerated clock difference with Google when checking `exp` / `iat`. */
const CLOCK_SKEW_SECONDS = 60;
const TOKEN_REQUEST_TIMEOUT_MS = 10_000;

export interface GoogleClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** Per-attempt secrets, kept in a signed httpOnly cookie between both legs. */
export interface OAuthAttempt {
  state: string;
  nonce: string;
  codeVerifier: string;
}

/** What the app keeps from a validated Google ID token. */
export interface GoogleIdentity {
  sub: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
}

/** Raised for any invalid answer from Google (mapped to a generic failure). */
export class GoogleAuthError extends Error {
  constructor(
    message: string,
    /** `unverified` when the Google e-mail is not verified. */
    readonly reason: "failed" | "unverified" = "failed",
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

const randomToken = (): string => randomBytes(32).toString("base64url");

export function createOAuthAttempt(): OAuthAttempt {
  return { state: randomToken(), nonce: randomToken(), codeVerifier: randomToken() };
}

/** URL the browser is sent to; Google redirects back to `redirectUri`. */
export function buildAuthorizationUrl(
  config: GoogleClientConfig,
  attempt: OAuthAttempt,
  locale?: string,
): string {
  const codeChallenge = createHash("sha256")
    .update(attempt.codeVerifier)
    .digest("base64url");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  if (locale) params.set("hl", locale);
  return `${AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

/** Exchanges the authorization code for the ID token (server-to-server). */
export async function exchangeCodeForIdToken(
  config: GoogleClientConfig,
  code: string,
  codeVerifier: string,
): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
    signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
  });
  const body = (await response.json().catch(() => null)) as {
    id_token?: unknown;
  } | null;
  if (!response.ok || typeof body?.id_token !== "string") {
    throw new GoogleAuthError(`Token exchange failed (HTTP ${response.status})`);
  }
  return body.id_token;
}

const optionalText = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

/**
 * Decodes the ID token payload and checks its claims. `now` is injectable for
 * tests (seconds since the epoch).
 */
export function validateIdToken(
  idToken: string,
  expected: { clientId: string; nonce: string },
  now: number = Math.floor(Date.now() / 1000),
): GoogleIdentity {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new GoogleAuthError("Malformed ID token");

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new GoogleAuthError("Malformed ID token payload");
  }
  if (!claims || typeof claims !== "object") {
    throw new GoogleAuthError("Malformed ID token payload");
  }

  if (typeof claims.iss !== "string" || !ISSUERS.has(claims.iss)) {
    throw new GoogleAuthError("Unexpected ID token issuer");
  }
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expected.clientId)) {
    throw new GoogleAuthError("ID token not issued for this client");
  }
  if (audiences.length > 1 && claims.azp !== expected.clientId) {
    throw new GoogleAuthError("ID token authorized party mismatch");
  }
  if (typeof claims.exp !== "number" || claims.exp + CLOCK_SKEW_SECONDS < now) {
    throw new GoogleAuthError("ID token expired");
  }
  if (typeof claims.iat === "number" && claims.iat - CLOCK_SKEW_SECONDS > now) {
    throw new GoogleAuthError("ID token issued in the future");
  }
  if (claims.nonce !== expected.nonce) {
    throw new GoogleAuthError("ID token nonce mismatch");
  }
  if (typeof claims.sub !== "string" || claims.sub === "") {
    throw new GoogleAuthError("ID token without subject");
  }
  const email = optionalText(claims.email)?.toLowerCase();
  if (!email || email.length > 255) {
    throw new GoogleAuthError("ID token without a usable e-mail");
  }
  if (claims.email_verified !== true && claims.email_verified !== "true") {
    throw new GoogleAuthError("Google e-mail not verified", "unverified");
  }

  return {
    sub: claims.sub,
    email,
    givenName: optionalText(claims.given_name),
    familyName: optionalText(claims.family_name),
    name: optionalText(claims.name),
  };
}
