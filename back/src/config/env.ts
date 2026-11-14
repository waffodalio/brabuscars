import { config as loadEnvFile } from "dotenv";
import { z } from "zod";

/**
 * Environment files are loaded most-specific first; `dotenv` never overrides an
 * already-set variable, so this order gives:
 *   .env.<NODE_ENV>.local  >  .env.<NODE_ENV>  >  .env
 *
 * Each environment (development / test / production) has its own `.env.<env>`
 * file with its own database, MariaDB user and secrets.
 */
const NODE_ENV = process.env.NODE_ENV ?? "development";
loadEnvFile({ path: `.env.${NODE_ENV}.local` });
loadEnvFile({ path: `.env.${NODE_ENV}` });
loadEnvFile({ path: ".env" });

/**
 * Optional public link: empty means "not set"; only `https://` is accepted so
 * the value can be rendered as an `href` safely (no `javascript:` URL).
 */
/** Optional free text: an empty value (e.g. `${VAR:-}` in compose) means unset. */
const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalHttpsUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "must start with https://")
    .optional(),
);

/** Optional secret/identifier: empty means "not set". */
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * Google OAuth credential: surrounding whitespace / quotes (stray `\r` from a
 * CRLF `.env`, copy-paste) are stripped so Google does not reject the client.
 */
const googleCredential = (schema: z.ZodString) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.trim().replace(/^(['"])(.*)\1$/, "$2").trim() || undefined
        : value,
    schema.optional(),
  );

/**
 * Centralised, validated access to environment variables.
 * The process exits immediately if the configuration is invalid or incomplete,
 * so the rest of the codebase can rely on `env` being well-formed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().startsWith("/").default("/api"),
  /** Exact origin of the frontend allowed by CORS (no wildcard). */
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  /**
   * Number of reverse proxies in front of the app (0 = none). Required so
   * rate limiting sees the real client IP behind a proxy without being
   * spoofable via X-Forwarded-For.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().default(""),
  DB_DATABASE: z.string().min(1),

  /** At least 32 chars — reject weak signing keys outright. */
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
  /**
   * AES-256 key (64 hex chars) encrypting the admins' TOTP secrets at rest.
   * Generate with `openssl rand -hex 32`. Never change it once admins have
   * enrolled: their 2FA would have to be reset (`npm run reset-mfa`).
   */
  MFA_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "must be 64 hexadecimal characters"),
  /** Issuer name shown in authenticator apps. */
  MFA_ISSUER: z.string().min(1).default("BrabusCars"),

  // --- "Sign in with Google" (OpenID Connect) — disabled when unset ---
  /** OAuth client id / secret from the Google Cloud console (both or neither). */
  GOOGLE_CLIENT_ID: googleCredential(
    z
      .string()
      .regex(
        /^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/,
        "must look like <numbers>-<id>.apps.googleusercontent.com",
      ),
  ),
  GOOGLE_CLIENT_SECRET: googleCredential(z.string().min(1)),
  /**
   * Callback URL registered on the Google client, pointing at this API's
   * `/auth/google/callback` (e.g. `https://example.com/api/auth/google/callback`).
   */
  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),

  // --- Outgoing e-mail (SMTP, e.g. Brevo) — password reset links ---
  /**
   * SMTP relay (Brevo: `smtp-relay.brevo.com`). Unset: e-mails are printed
   * to the console in development / test, and not sent at all in production.
   */
  SMTP_HOST: optionalString,
  /** 587 = STARTTLS (Brevo default), 465 = implicit TLS. */
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  /** SMTP login (Brevo: the account's SMTP login, e.g. `xxxx@smtp-brevo.com`). */
  SMTP_USER: optionalString,
  /** SMTP key (Brevo: « Clés SMTP », not the API key). */
  SMTP_PASSWORD: optionalString,
  /**
   * Sender shown to recipients, e.g. `BrabusCars <no-reply@brabuscars.be>`. The
   * address must be a verified sender / domain in Brevo.
   */
  MAIL_FROM: z.string().min(3).default("BrabusCars <no-reply@brabuscars.be>"),

  // --- Uploads (image files stored on the local disk) ---
  /** Directory where image files are written. Keep it outside the repo and,
   *  in production, outside the deploy directory. */
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  /** URL prefix the API prepends to a storage key to build a public image URL. */
  PUBLIC_UPLOADS_URL: z
    .string()
    .url()
    .default("http://localhost:4000/uploads"),
  /** Max accepted upload size, in bytes (default 15 MiB). */
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 1024 * 1024),
  /** Max images per listing. */
  MAX_IMAGES_PER_LISTING: z.coerce.number().int().positive().default(20),
  /**
   * Private directory for the purchase orders / invoices (PDF). Never served
   * publicly — only downloaded through the admin API. Keep it apart from
   * UPLOAD_DIR.
   */
  DOCUMENTS_DIR: z.string().min(1).default("documents"),

  // --- Company (single dealership: all vehicles are at this address) ---
  COMPANY_NAME: z.string().min(1).default("BrabusCars"),
  COMPANY_ADDRESS: z.string().min(1).default("12 avenue de l'Automobile"),
  COMPANY_POSTAL_CODE: z.string().min(1).default("69003"),
  COMPANY_CITY: z.string().min(1).default("Lyon"),
  COMPANY_COUNTRY: z.string().min(1).default("France"),
  COMPANY_PHONE: z.string().min(1).default("+33 4 78 00 00 00"),
  COMPANY_EMAIL: z.string().email().default("contact@brabuscars.be"),
  COMPANY_HOURS: z
    .string()
    .min(1)
    .default("Du lundi au samedi, 9h–19h"),
  /** Opening hours in English / Dutch — optional, fall back to COMPANY_HOURS. */
  COMPANY_HOURS_EN: optionalText,
  COMPANY_HOURS_NL: optionalText,
  /** Social pages shown in the site footer — optional, hidden when empty. */
  COMPANY_INSTAGRAM_URL: optionalHttpsUrl,
  COMPANY_FACEBOOK_URL: optionalHttpsUrl,
  /** Legal details printed on purchase orders and invoices — optional. */
  COMPANY_VAT_NUMBER: optionalText,
  COMPANY_IBAN: optionalText,
  COMPANY_BIC: optionalText,
  /** Legal notice page: registered name with its legal form (« BrabusCars SRL »),
   * defaults to COMPANY_NAME; and the hosting provider (name + address). */
  COMPANY_LEGAL_NAME: optionalText,
  COMPANY_HOSTING: optionalText,
}).refine(
  (value) => Boolean(value.GOOGLE_CLIENT_ID) === Boolean(value.GOOGLE_CLIENT_SECRET),
  {
    message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
    path: ["GOOGLE_CLIENT_SECRET"],
  },
).refine(
  (value) => !value.SMTP_HOST || Boolean(value.SMTP_USER && value.SMTP_PASSWORD),
  {
    message: "SMTP_USER and SMTP_PASSWORD are required when SMTP_HOST is set",
    path: ["SMTP_PASSWORD"],
  },
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDevelopment = env.NODE_ENV === "development";
/** "Sign in with Google" is offered only when its credentials are configured. */
export const isGoogleAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);
/** Real e-mails are sent only when an SMTP relay is configured. */
export const isSmtpEnabled = Boolean(env.SMTP_HOST);
