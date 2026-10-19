import type { Money } from "@/lib/format/money";

// PLACEHOLDER: plan names, prices, limits, billing cycle, trial length and
// invoice amounts/tax are still open in v8. Every such value lives in this one
// file so it can be replaced in one place. null means "not decided" and shows
// on screen as "[… TBD]". Values the design already shows are marked (design).

// Decided: subscription billing is in LKR.
export const SUBSCRIPTION_CURRENCY = "LKR";

export type PlanLimitKey = "properties" | "units" | "staff";

export type PlanFeatureKey = "website" | "reports" | "whatsapp" | "multiProperty" | "auditTrail";

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  website: "Booking website",
  reports: "Reports",
  whatsapp: "WhatsApp messages",
  multiProperty: "More than one property",
  auditTrail: "Audit trail",
};

export type PlaceholderPlan = {
  id: string;
  name: string;
  price: Money | null;
  limits: Record<PlanLimitKey, number | null>;
  whatsappMessages: number | null; // monthly quota
  features: Record<PlanFeatureKey, boolean>;
};

export const PLACEHOLDER_PLANS: PlaceholderPlan[] = [
  {
    id: "plan_smaller",
    name: "[Smaller plan: name TBD]",
    price: null,
    // PLACEHOLDER: a staff limit below today's usage, so a blocked downgrade can be seen.
    limits: { properties: null, units: null, staff: 3 },
    whatsappMessages: null,
    features: { website: true, reports: false, whatsapp: false, multiProperty: false, auditTrail: true },
  },
  {
    id: "plan_standard",
    name: "Standard Plan", // (design)
    price: null,
    limits: { properties: null, units: null, staff: 5 }, // staff 5 (design)
    whatsappMessages: 1_000, // (design, Overview)
    features: { website: true, reports: true, whatsapp: true, multiProperty: true, auditTrail: true },
  },
  {
    id: "plan_larger",
    name: "[Larger plan: name TBD]",
    price: null,
    limits: { properties: null, units: null, staff: null },
    whatsappMessages: null,
    features: { website: true, reports: true, whatsapp: true, multiProperty: true, auditTrail: true },
  },
];

export const PLACEHOLDER_CURRENT_PLAN_ID = "plan_standard";
export const PLACEHOLDER_RENEWS_ON = "2026-11-01"; // (design)
export const PLACEHOLDER_BILLING_CYCLE: string | null = null;
export const PLACEHOLDER_TRIAL_DAYS: number | null = null;
export const PLACEHOLDER_INVOICE_AMOUNT: Money | null = null;
export const PLACEHOLDER_INVOICE_TAX: Money | null = null;
export const PLACEHOLDER_INVOICE_TOTAL: Money | null = null;

export function placeholderPlan(id: string) {
  return PLACEHOLDER_PLANS.find((plan) => plan.id === id) ?? null;
}
