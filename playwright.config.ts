import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "https://calzoleria-prevenzano-production.up.railway.app",
    locale: "en-US",
    timezoneId: "Europe/Rome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "smoke",
      testMatch: /smoke-purchase\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "all-products",
      testMatch: /all-products-purchase\.spec\.ts/,
      // Project-level overrides for workers/retries/timeout/fullyParallel are
      // applied via CLI flags in the `test:e2e:all` script (Playwright 1.49.1
      // does not support these as Project-level config keys).
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
