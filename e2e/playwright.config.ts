import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against an already deployed environment (preprod in CI).
 *
 *   E2E_BASE_URL=https://preprod.chcars.fr npm test
 *
 * Front and API share one origin behind the reverse proxy (`deploy/`), so
 * API calls go to `${E2E_BASE_URL}/api`.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Login/register are rate-limited (10 / 15 min per IP): keep CI gentle.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
