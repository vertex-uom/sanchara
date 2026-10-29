// Scratch checks for the subscription logic and fixture. Run: node check.ts
import assert from "node:assert/strict";
import { usageRatio } from "./lib/format/numbers.ts";
import { PLACEHOLDER_PLANS, placeholderPlan } from "./lib/plan/placeholders.ts";
import { createStaff, listStaff } from "./features/staff.ts";
import { blockingUsage, isAtLimit, statusLabel } from "./features/subscription/subscription-rules.ts";
import { invoiceHref, parseSubscriptionParams, subscriptionHref } from "./features/subscription/subscription-params.ts";
import {
  cancelSubscription,
  changePlan,
  getInvoice,
  getSubscription,
  getSubscriptionSummary,
} from "./features/subscription/server/subscription.ts";

// usageRatio
assert.equal(usageRatio(0, 5), 0);
assert.equal(usageRatio(4, 5), 0.8);
assert.equal(usageRatio(7, 5), 1, "over the limit is a full bar");
assert.equal(usageRatio(3, null), 0);
assert.equal(usageRatio(3, 0), 0);

// Rules
assert.deepEqual(["active", "trial", "past-due", "cancelled"].map((s) => statusLabel(s as never)), ["Active", "Trial", "Past due", "Cancelled"]);
const staff = (used: number, limit: number | null) => ({ key: "staff" as const, label: "Staff accounts", used, limit });
assert.ok(isAtLimit(staff(5, 5)) && isAtLimit(staff(6, 5)) && !isAtLimit(staff(4, 5)) && !isAtLimit(staff(99, null)));
assert.deepEqual(blockingUsage([staff(4, 5)], { limits: { properties: null, units: null, staff: 3 } }).map((u) => u.key), ["staff"]);
assert.deepEqual(blockingUsage([staff(3, 5)], { limits: { properties: null, units: null, staff: 3 } }), [], "exactly at the target limit fits");
assert.deepEqual(blockingUsage([staff(50, 5)], { limits: { properties: null, units: null, staff: null } }), [], "unknown limit never blocks");

// Params
assert.deepEqual(parseSubscriptionParams({}), { panel: null, error: null });
assert.deepEqual(parseSubscriptionParams({ panel: "upgrade", error: "constructor" }), { panel: null, error: null });
assert.deepEqual(parseSubscriptionParams({ panel: "cancel", error: "OVER_LIMIT" }), { panel: "cancel", error: "OVER_LIMIT" });
assert.equal(subscriptionHref(), "/company/subscription");
assert.equal(subscriptionHref({ panel: "change-plan" }), "/company/subscription?panel=change-plan");
assert.equal(invoiceHref("inv_2026_10"), "/company/subscription/invoices/inv_2026_10");

// Placeholders: one current plan matching the design, ids unique
assert.equal(placeholderPlan("plan_standard")?.name, "Standard Plan");
assert.equal(new Set(PLACEHOLDER_PLANS.map((p) => p.id)).size, PLACEHOLDER_PLANS.length);
assert.ok(PLACEHOLDER_PLANS.every((p) => p.price === null), "prices are not invented");

// Store: starts Active on Standard Plan; usage matches the Staff fixture
let sub = await getSubscription();
assert.equal(sub.status, "active");
assert.equal(sub.plan.name, "Standard Plan");
assert.equal(sub.renewsOn, "2026-11-01");
assert.equal(sub.billingCycle, null);
const staffSeats = (await listStaff({ role: null, inactive: false, q: "" })).seats;
assert.deepEqual(
  sub.usage.map((u) => [u.key, u.used, u.limit]),
  [["properties", 2, null], ["units", 27, null], ["staff", staffSeats.used, staffSeats.limit]],
);
assert.equal(sub.invoices.length, 3);
assert.ok(sub.invoices.every((i) => i.total === null && i.description.startsWith("Standard Plan")));
assert.deepEqual(await getSubscriptionSummary(), { planName: "Standard Plan", renewsOn: "2026-11-01", whatsapp: { used: 850, limit: 1000 } });
assert.equal((await getInvoice("inv_2026_09"))?.number, "INV-2026-0009");
assert.equal(await getInvoice("nope"), null);

// Change plan
assert.equal((await changePlan("plan_nope"))?.code, "NOT_FOUND");
assert.equal((await changePlan("plan_smaller"))?.code, "OVER_LIMIT", "4 staff > 3");
assert.equal(await changePlan("plan_larger"), null);
sub = await getSubscription();
assert.deepEqual(sub.scheduledPlan, { id: "plan_larger", name: "[Larger plan: name TBD]", effectiveOn: "2026-11-01" });
assert.equal(sub.plan.name, "Standard Plan", "takes effect at renewal");
assert.equal(await changePlan("plan_standard"), null);
assert.equal((await getSubscription()).scheduledPlan, null, "choosing the current plan drops the pending change");

// At the staff limit: 5 of 5 is "at limit"
assert.equal(await createStaff({ fullName: "Fifth", email: "fifth@example.com", role: "front-desk" }), null);
const staffUsage = (await getSubscription()).usage.find((u) => u.key === "staff")!;
assert.ok(isAtLimit(staffUsage), `${staffUsage.used} of ${staffUsage.limit}`);

// Cancel
assert.equal(await cancelSubscription(), null);
sub = await getSubscription();
assert.equal(sub.status, "cancelled");
assert.equal((await changePlan("plan_larger"))?.code, "CANCELLED");
console.log("all checks passed");
