import { expect, test } from "@playwright/test";

// Plain localhost serves the central site in dev (see src/lib/tenant/hosts.ts).
test("central site loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
});
