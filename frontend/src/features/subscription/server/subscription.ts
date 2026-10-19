import type { SubscriptionSummary } from "../types";

// TEMPORARY fixture. Replace the body with the subscription API call once
// the API client exists; the return type stays the same.
export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  return {
    planName: "Standard Plan",
    renewsOn: "2026-11-01",
    whatsapp: { used: 850, limit: 1_000 },
  };
}
