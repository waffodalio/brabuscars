import "reflect-metadata";

/**
 * `src/config/env.ts` validates `process.env` at import time and calls
 * `process.exit(1)` if anything required is missing — fine for the running
 * server, fatal for a test runner. These stand-in values let any module
 * that transitively imports `env.ts` (e.g. `utils/jwt.ts`) load normally
 * without a real `.env.test` file. Vitest always runs `setupFiles` before
 * loading test files, so this executes before any of them is imported.
 */
process.env.NODE_ENV ??= "test";
process.env.DB_HOST ??= "localhost";
process.env.DB_USERNAME ??= "test";
process.env.DB_DATABASE ??= "test";
process.env.JWT_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.MFA_ENCRYPTION_KEY ??= "0".repeat(64);
