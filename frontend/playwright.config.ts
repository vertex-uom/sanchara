import { defineConfig, devices } from "@playwright/test";

// Runs in the `e2e` compose service, which shares the web container's network:
// http://localhost:3000 is the central site (dev server) and http://api:3000 the API.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  // The dev server compiles routes on first hit.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
