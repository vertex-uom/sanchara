import { randomUUID } from "node:crypto";
import { test as base, type APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://api:3000";
export const PASSWORD = "correct horse battery";

// A fresh traveller per test, so tests never share accounts or lockouts.
export function newGuest() {
  const id = randomUUID().slice(0, 8);
  return { fullName: `Test Traveller ${id}`, email: `traveller-${id}@example.com`, password: PASSWORD };
}

// Each test looks like a different visitor (the API rate-limits per IP and
// trusts the IP the web server forwards).
function randomIp() {
  const part = () => Math.floor(Math.random() * 254) + 1;
  return `198.51.${part()}.${part()}`;
}

export const test = base.extend<{ ip: string }>({
  // Playwright's fixture callback is named `provide` here: "use" trips the React hooks lint rule.
  ip: async ({}, provide) => provide(randomIp()),
  context: async ({ context, ip }, provide) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await provide(context);
  },
});

export { expect } from "@playwright/test";

// Creates an account straight through the API (faster than the form).
export async function registerViaApi(request: APIRequestContext, guest: ReturnType<typeof newGuest>, ip: string) {
  const response = await request.post(`${API_URL}/v1/auth/guest/register`, {
    data: guest,
    headers: { "x-forwarded-for": ip },
  });
  if (!response.ok()) throw new Error(`register failed: ${response.status()} ${await response.text()}`);
}
