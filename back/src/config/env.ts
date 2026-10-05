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
const optionalHttpsUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "must start with https://")
    .optional(),
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
  MFA_ISSUER: z.string().min(1).default("CHCars"),

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

  // --- Company (single dealership: all vehicles are at this address) ---
  COMPANY_NAME: z.string().min(1).default("CHCars"),
  COMPANY_ADDRESS: z.string().min(1).default("12 avenue de l'Automobile"),
  COMPANY_POSTAL_CODE: z.string().min(1).default("69003"),
  COMPANY_CITY: z.string().min(1).default("Lyon"),
  COMPANY_COUNTRY: z.string().min(1).default("France"),
  COMPANY_PHONE: z.string().min(1).default("+33 4 78 00 00 00"),
  COMPANY_EMAIL: z.string().email().default("contact@chcars.fr"),
  COMPANY_HOURS: z
    .string()
    .min(1)
    .default("Du lundi au samedi, 9h–19h"),
  /** Social pages shown in the site footer — optional, hidden when empty. */
  COMPANY_INSTAGRAM_URL: optionalHttpsUrl,
  COMPANY_FACEBOOK_URL: optionalHttpsUrl,
});

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
