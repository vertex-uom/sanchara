// Company subscription as returned by the API. Plan names, limits and prices
// are configuration-driven; the UI shows only what the API sends.
export type SubscriptionSummary = {
  planName: string;
  renewsOn: string; // date only, "2026-11-01"
  whatsapp: { used: number; limit: number } | null; // null when the plan has no WhatsApp quota
};
