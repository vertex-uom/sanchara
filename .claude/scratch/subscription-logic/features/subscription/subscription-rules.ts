import type { PlanOption, SubscriptionStatus, Usage } from "./types.ts";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  trial: "Trial",
  "past-due": "Past due",
  cancelled: "Cancelled",
};

export function statusLabel(status: SubscriptionStatus) {
  return STATUS_LABELS[status];
}

// At a limit nothing more can be added (v8: limits block). Unknown limits never block.
export function isAtLimit(usage: Usage) {
  return usage.limit !== null && usage.used >= usage.limit;
}

// Usage a plan can't hold, for refusing a downgrade. Empty means the plan fits.
export function blockingUsage(usage: Usage[], plan: Pick<PlanOption, "limits">) {
  return usage.filter((item) => {
    const limit = plan.limits[item.key];
    return limit !== null && item.used > limit;
  });
}
