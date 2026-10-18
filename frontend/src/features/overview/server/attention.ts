import type { AttentionItem } from "../types";

// TEMPORARY fixture. Replace the body with the attention-items API call once
// the API client exists; the return type stays the same.
export async function getAttentionItems(propertyId: string): Promise<AttentionItem[]> {
  void propertyId;
  return [
    { id: "att_1", kind: "enquiry-holds-expiring", count: 2 },
    { id: "att_2", kind: "payment-pending", count: 1, holdMinutes: 10 },
    { id: "att_3", kind: "no-shows-marked", count: 1 },
    { id: "att_4", kind: "whatsapp-usage", usedRatio: 0.85 },
    { id: "att_5", kind: "subscription-renewal", renewsOn: "2026-11-01" },
  ];
}
