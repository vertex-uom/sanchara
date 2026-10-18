// Items the API flags for the Overview "Needs attention" list.
export type AttentionItem =
  | { id: string; kind: "enquiry-holds-expiring"; count: number }
  | { id: string; kind: "payment-pending"; count: number; holdMinutes: number }
  | { id: string; kind: "no-shows-marked"; count: number }
  | { id: string; kind: "whatsapp-usage"; usedRatio: number }
  | { id: string; kind: "subscription-renewal"; renewsOn: string };
