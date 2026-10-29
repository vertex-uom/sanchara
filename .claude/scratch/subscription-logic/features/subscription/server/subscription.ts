import { apiError, type ApiError } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/lib/api-client/errors.ts";
import {
  PLACEHOLDER_BILLING_CYCLE,
  PLACEHOLDER_CURRENT_PLAN_ID,
  PLACEHOLDER_INVOICE_AMOUNT,
  PLACEHOLDER_INVOICE_TAX,
  PLACEHOLDER_INVOICE_TOTAL,
  PLACEHOLDER_PLANS,
  PLACEHOLDER_RENEWS_ON,
  PLAN_FEATURE_LABELS,
  placeholderPlan,
  type PlaceholderPlan,
  type PlanFeatureKey,
} from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/lib/plan/placeholders.ts";
import { getCompanyProperties } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/features/properties.ts";
import { listStaff } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/features/staff.ts";
import { blockingUsage } from "../subscription-rules.ts";
import type { Invoice, PlanOption, SubscriptionDetails, SubscriptionStatus, SubscriptionSummary, Usage } from "../types.ts";

type Store = {
  planId: string;
  status: SubscriptionStatus;
  renewsOn: string;
  trialEndsOn: string | null;
  scheduledPlanId: string | null;
  invoices: Invoice[];
};

// Fixture-only values: units match the Reports fixture (26) plus one villa;
// WhatsApp usage matches the Overview card.
const FIXTURE_UNITS = 27;
const FIXTURE_WHATSAPP_USED = 850;

// The fixture's invoices are monthly only to have rows; the billing cycle is still open.
function invoice(month: string, monthName: string, status: Invoice["status"]): Invoice {
  return {
    id: `inv_2026_${month}`,
    number: `INV-2026-00${month}`,
    issuedOn: `2026-${month}-01`,
    description: `${placeholderPlan(PLACEHOLDER_CURRENT_PLAN_ID)?.name} · ${monthName} 2026`,
    amount: PLACEHOLDER_INVOICE_AMOUNT,
    tax: PLACEHOLDER_INVOICE_TAX,
    total: PLACEHOLDER_INVOICE_TOTAL,
    status,
  };
}

// TEMPORARY in-memory dev store so the page works end to end before the
// subscription API exists. Replace this file with API calls; the signatures stay.
// Kept on globalThis so hot reload doesn't reset it; a server restart does.
const holder = globalThis as typeof globalThis & { sancharaSubscriptionStore?: Store };

function store(): Store {
  holder.sancharaSubscriptionStore ??= {
    planId: PLACEHOLDER_CURRENT_PLAN_ID,
    status: "active",
    renewsOn: PLACEHOLDER_RENEWS_ON,
    trialEndsOn: null,
    scheduledPlanId: null,
    invoices: [invoice("10", "October", "paid"), invoice("09", "September", "paid"), invoice("08", "August", "paid")],
  };
  return holder.sancharaSubscriptionStore;
}

function toPlanOption(plan: PlaceholderPlan): PlanOption {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    limits: plan.limits,
    features: (Object.keys(PLAN_FEATURE_LABELS) as PlanFeatureKey[]).map((key) => ({
      key,
      label: PLAN_FEATURE_LABELS[key],
      included: plan.features[key],
    })),
  };
}

function currentPlan() {
  const plan = placeholderPlan(store().planId);
  if (!plan) throw new Error(`Unknown plan ${store().planId}`);
  return plan;
}

async function usageFor(plan: PlaceholderPlan): Promise<Usage[]> {
  const [properties, staff] = await Promise.all([
    getCompanyProperties(),
    listStaff({ role: null, inactive: false, q: "" }),
  ]);
  return [
    { key: "properties", label: "Properties", used: properties.length, limit: plan.limits.properties },
    { key: "units", label: "Units", used: FIXTURE_UNITS, limit: plan.limits.units },
    { key: "staff", label: "Staff accounts", used: staff.seats.used, limit: plan.limits.staff },
  ];
}

export async function getSubscription(): Promise<SubscriptionDetails> {
  const data = store();
  const plan = currentPlan();
  const scheduled = data.scheduledPlanId ? placeholderPlan(data.scheduledPlanId) : null;
  return {
    plan: toPlanOption(plan),
    status: data.status,
    renewsOn: data.renewsOn,
    trialEndsOn: data.trialEndsOn,
    billingCycle: PLACEHOLDER_BILLING_CYCLE,
    scheduledPlan: scheduled ? { id: scheduled.id, name: scheduled.name, effectiveOn: data.renewsOn } : null,
    usage: await usageFor(plan),
    plans: PLACEHOLDER_PLANS.map(toPlanOption),
    invoices: data.invoices,
  };
}

// Overview card and sidebar plan card.
export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const plan = currentPlan();
  return {
    planName: plan.name,
    renewsOn: store().renewsOn,
    whatsapp: plan.whatsappMessages === null ? null : { used: FIXTURE_WHATSAPP_USED, limit: plan.whatsappMessages },
  };
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  return store().invoices.find((item) => item.id === id) ?? null;
}

// Plan changes take effect at the next renewal. Choosing the current plan
// drops a pending change.
export async function changePlan(planId: string): Promise<ApiError | null> {
  const data = store();
  if (data.status === "cancelled") return apiError(409, "CANCELLED", "This subscription is cancelled.");
  const target = placeholderPlan(planId);
  if (!target) return apiError(404, "NOT_FOUND", "That plan isn't available.");
  if (target.id === data.planId) {
    data.scheduledPlanId = null;
    return null;
  }
  const over = blockingUsage(await usageFor(currentPlan()), target);
  if (over.length > 0) {
    return apiError(409, "OVER_LIMIT", `That plan can't hold your current ${over.map((item) => item.label.toLowerCase()).join(", ")}.`);
  }
  data.scheduledPlanId = target.id;
  return null;
}

// The plan stays usable until renewsOn.
export async function cancelSubscription(): Promise<ApiError | null> {
  const data = store();
  data.status = "cancelled";
  data.scheduledPlanId = null;
  return null;
}
