import { defineConfig, devices } from "@playwright/test";

// Runs against an already running dev server; in Docker that is the web
// container (`docker compose run --rm e2e`, see docker-compose.yml).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Default is half the host's logical CPUs (11 here): that many Chromiums plus
  // the dev server compiling as many routes at once is a multi-GB spike.
  workers: process.env.CI ? 1 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
