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
