import type { Money } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/lib/format/money.ts";
import type { PlanFeatureKey, PlanLimitKey } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/lib/plan/placeholders.ts";

// Company subscription as returned by the API. Plan names, limits and prices
// are configuration-driven; the UI shows only what the API sends.
export type SubscriptionSummary = {
  planName: string;
  renewsOn: string; // date only, "2026-11-01"
  whatsapp: { used: number; limit: number } | null; // null when the plan has no WhatsApp quota
};

export type SubscriptionStatus = "active" | "trial" | "past-due" | "cancelled";

// null price or limit: not decided yet (shown as "[… TBD]").
export type PlanOption = {
  id: string;
  name: string;
  price: Money | null;
  limits: Record<PlanLimitKey, number | null>;
  features: { key: PlanFeatureKey; label: string; included: boolean }[];
};

export type Usage = { key: PlanLimitKey; label: string; used: number; limit: number | null };

export type InvoiceStatus = "paid" | "due" | "failed";

export type Invoice = {
  id: string;
  number: string; // "INV-2026-0010"
  issuedOn: string; // date only
  description: string;
  amount: Money | null;
  tax: Money | null;
  total: Money | null;
  status: InvoiceStatus;
};

export type SubscriptionDetails = {
  plan: PlanOption;
  status: SubscriptionStatus;
  renewsOn: string; // date only; also when a cancelled plan ends
  trialEndsOn: string | null;
  billingCycle: string | null;
  // A plan change waiting for the next renewal.
  scheduledPlan: { id: string; name: string; effectiveOn: string } | null;
  usage: Usage[];
  plans: PlanOption[];
  invoices: Invoice[];
};
