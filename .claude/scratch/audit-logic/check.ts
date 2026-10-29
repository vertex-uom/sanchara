// Scratch checks for the audit trail logic and fixture. Run: node check.ts
import assert from "node:assert/strict";
import { colomboDateKey, formatDateTimeParts, isIsoDate, monthRange } from "./lib/format/dates.ts";
import { auditHref, parseAuditParams, type AuditFilters } from "./features/audit/audit-params.ts";
import { AUDIT_CATEGORIES } from "./features/audit/config.ts";
import { getAuditEntry, getAuditPage } from "./features/audit/server/audit.ts";
import type { AuditRecord } from "./features/audit/types.ts";

const today = "2026-10-19";

// Date helpers
assert.deepEqual(monthRange(today), { from: "2026-10-01", to: "2026-10-31" });
assert.ok(isIsoDate("2028-02-29") && !isIsoDate("2026-02-29") && !isIsoDate("2026-1-01"));
assert.equal(colomboDateKey(new Date("2026-10-18T20:00:00Z")), "2026-10-19", "after 18:30 UTC is the next day in Colombo");
assert.deepEqual(formatDateTimeParts("2026-10-03T11:35:00+05:30"), { date: "03 Oct 2026", time: "11:35 AM" });

// Parser
const p = (query: Record<string, string | string[]>) => parseAuditParams(query, today);
const defaults = p({});
assert.deepEqual(defaults, {
  category: null, from: "2026-10-01", to: "2026-10-31", customRange: false,
  staffId: null, role: null, action: null, q: "", page: 1, entryId: null,
});
assert.equal(p({ category: "subscription" }).category, null);
assert.equal(p({ category: "refund" }).category, "refund");
assert.equal(p({ from: "2026-10-12", to: "2026-10-05" }).customRange, false, "reversed range");
assert.equal(p({ from: "2025-01-01", to: "2026-10-01" }).customRange, false, "longer than a year");
assert.equal(p({ from: "2026-09-01", to: "2026-10-31" }).customRange, true);
assert.equal(p({ role: "admin" }).role, null);
assert.equal(p({ action: "exported" }).action, null);
for (const page of ["0", "-1", "1.5", "abc", "99999"]) assert.equal(p({ page }).page, 1, `page=${page}`);
assert.equal(p({ page: "2" }).page, 2);
assert.equal(p({ entry: "../x" }).entryId, null);
assert.equal(p({ q: "x".repeat(300) }).q.length, 100);
assert.equal(auditHref(defaults), "/company/audit");
assert.equal(
  auditHref({ ...p({ from: "2026-09-01", to: "2026-10-31", q: "SN", page: "2" }) }, { category: "rate" }),
  "/company/audit?category=rate&from=2026-09-01&to=2026-10-31&q=SN",
  "changing category resets the page",
);
assert.equal(auditHref({ ...defaults, page: 2 }, { entryId: "aud_041" }), "/company/audit?page=2&entry=aud_041");

// Fixture, all of it (wide range) on Palm Breeze
const wide: AuditFilters = { ...defaults, from: "2026-01-01", to: "2026-12-31", customRange: true };
async function all(filters: AuditFilters) {
  const first = await getAuditPage("palm-breeze", filters);
  const second = await getAuditPage("palm-breeze", { ...filters, page: 2 });
  return { first, entries: first.page === 2 ? first.entries : [...first.entries, ...(second.page === 2 ? second.entries : [])] };
}
const { first, entries } = await all(wide);
assert.equal(first.total, entries.length);
assert.equal(first.entries.length, 25, "page size");
assert.ok(first.total > 25, "fixture spans two pages over a wide range");
assert.ok(entries.every((entry) => entry.propertyId === "palm-breeze" || entry.propertyId === null), "property scope");
assert.ok(!entries.some((entry) => entry.record.includes("LV-")), "other property hidden");
assert.ok(entries.some((entry) => entry.propertyId === null), "company-wide staff entries shown");

// Newest first
for (let i = 1; i < entries.length; i++) assert.ok(entries[i - 1].occurredAt >= entries[i].occurredAt || Date.parse(entries[i - 1].occurredAt) >= Date.parse(entries[i].occurredAt));

// Every category and action is covered
for (const category of AUDIT_CATEGORIES) assert.ok(entries.some((entry) => entry.category === category), category);
for (const action of ["created", "updated", "deleted"]) assert.ok(entries.some((entry) => entry.action === action), action);

// Role model
const roleRules = (entry: AuditRecord) => {
  if (entry.actor.role === "front-desk") assert.ok(["reservation", "payment", "refund", "block"].includes(entry.category), entry.id);
  if (entry.category === "staff") {
    assert.ok(entry.actor.role !== "front-desk", entry.id);
    if (entry.actor.role === "manager") {
      assert.equal(entry.action, "created", `${entry.id}: Manager only creates`);
      assert.deepEqual(entry.changes.find((change) => change.field === "Role")?.after, { kind: "text", text: "Front Desk" }, entry.id);
    }
  }
};
entries.forEach(roleRules);
const kamala = entries.filter((entry) => entry.actor.name === "Kamala Silva");
assert.ok(kamala.some((entry) => entry.actor.role === "front-desk") && kamala.some((entry) => entry.actor.role === "manager"), "role at the time");
for (const entry of kamala) {
  const promoted = Date.parse(entry.occurredAt) > Date.parse("2026-10-11T10:03:00+05:30");
  assert.equal(entry.actor.role, promoted ? "manager" : "front-desk", entry.id);
}

// Chip counts equal the rows for every category, with other filters applied
for (const filters of [wide, defaults, { ...defaults, role: "front-desk" as const }, { ...wide, q: "room 2" }, { ...wide, action: "deleted" as const }]) {
  const base = await getAuditPage("palm-breeze", filters);
  let sum = 0;
  for (const category of AUDIT_CATEGORIES) {
    const page = await getAuditPage("palm-breeze", { ...filters, category });
    assert.equal(base.counts[category], page.total, `${category} count`);
    sum += page.total;
  }
  assert.equal(base.counts.all, sum);
  assert.equal(base.counts.all, base.total);
}

// Default (this month) and search
const october = await getAuditPage("palm-breeze", defaults);
assert.ok(october.entries.every((entry) => entry.occurredAt.startsWith("2026-10")));
assert.equal((await getAuditPage("palm-breeze", { ...wide, q: "sn-2041" })).total, 1, "booking ID");
assert.ok((await getAuditPage("palm-breeze", { ...wide, q: "Room 5" })).total >= 1, "unit");
assert.equal(
  (await getAuditPage("palm-breeze", { ...wide, q: "anji" })).total,
  entries.filter((entry) => entry.actor.name === "Anji Silva").length,
  "staff name",
);
assert.equal((await getAuditPage("palm-breeze", { ...wide, staffId: "staff_6" })).total, kamala.length);

// Pagination edges
assert.equal((await getAuditPage("palm-breeze", { ...wide, page: 9 })).page, 2, "past the end shows the last page");
const empty = await getAuditPage("palm-breeze", { ...wide, q: "nothing-matches" });
assert.equal(empty.total, 0);
assert.equal(empty.page, 1);

// Entries
assert.equal((await getAuditEntry("palm-breeze", "aud_041"))?.title, "Reservation #SN-2041 updated");
assert.equal(await getAuditEntry("palm-breeze", "aud_011"), null, "other property's entry is not reachable");
assert.ok(await getAuditEntry("lagoon-view", "aud_036"), "staff entries show on every property");

console.log(`all checks passed (${first.total} records on Palm Breeze, ${october.total} this month)`);
