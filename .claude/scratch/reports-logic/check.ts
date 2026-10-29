// Scratch checks for the reports filters and fixture. Run: node check.ts
import assert from "node:assert/strict";
import { parseReportFilters, presetRange, reportHref } from "./report-filters.ts";
import { getReports } from "./server/reports.ts";

const today = "2026-10-19";
assert.deepEqual(presetRange("this-month", today), { from: "2026-10-01", to: "2026-10-31" });
assert.deepEqual(presetRange("last-month", today), { from: "2026-09-01", to: "2026-09-30" });
assert.deepEqual(presetRange("this-quarter", today), { from: "2026-10-01", to: "2026-12-31" });
assert.deepEqual(presetRange("last-month", "2026-01-15"), { from: "2025-12-01", to: "2025-12-31" });
assert.deepEqual(presetRange("this-month", "2028-02-10"), { from: "2028-02-01", to: "2028-02-29" });

const p = (query: Record<string, string | string[]>) => parseReportFilters(query, today);
assert.deepEqual(p({}), { tab: "occupancy", range: "this-month", from: "2026-10-01", to: "2026-10-31", roomType: "all" });
assert.equal(p({ range: "last-month" }).from, "2026-09-01");
assert.equal(p({ range: "bogus" }).range, "this-month");
assert.equal(p({ tab: "tax" }).tab, "tax");
assert.equal(p({ tab: "hack" }).tab, "occupancy");
assert.equal(p({ tab: ["tax", "revenue"] }).tab, "occupancy");
assert.equal(p({ from: "2026-10-05", to: "2026-10-12" }).range, "custom");
assert.equal(p({ from: "2026-09-01", to: "2026-09-30" }).range, "last-month");
assert.equal(p({ from: "2026-10-12", to: "2026-10-05" }).range, "this-month"); // reversed
assert.equal(p({ from: "2026-02-30", to: "2026-03-05" }).range, "this-month"); // not a real date
assert.equal(p({ from: "2024-01-01", to: "2026-01-01" }).range, "this-month"); // > 366 days
assert.equal(p({ from: "x", to: "y" }).range, "this-month");
assert.equal(p({ roomType: "deluxe" }).roomType, "deluxe");
assert.equal(p({ roomType: "<script>" }).roomType, "all");

const f = p({ from: "2026-10-05", to: "2026-10-12", roomType: "deluxe", tab: "tax" });
assert.equal(reportHref("/p/x/reports", f), "/p/x/reports?tab=tax&from=2026-10-05&to=2026-10-12&roomType=deluxe");
assert.equal(reportHref("/p/x/reports", f, { range: "this-month", tab: "occupancy" }), "/p/x/reports?roomType=deluxe");
assert.equal(reportHref("/p/x/reports", p({})), "/p/x/reports");

for (const [label, query] of [
  ["October", {}],
  ["Q4", { range: "this-quarter" }],
  ["Deluxe", { roomType: "deluxe" }],
  ["One day", { from: "2026-10-19", to: "2026-10-19" }],
] as const) {
  const data = await getReports("palm-breeze", p(query));
  const o = data.occupancy!;
  const occ = o.kpis.occupancy.kind === "ratio" ? o.kpis.occupancy.ratio : NaN;
  const adr = o.kpis.adr.kind === "money" ? o.kpis.adr.amounts[0].amountMinor : NaN;
  const revpar = o.kpis.revpar.kind === "money" ? o.kpis.revpar.amounts[0].amountMinor : NaN;
  const nights = o.kpis.roomNightsSold.kind === "count" ? o.kpis.roomNightsSold.count : NaN;
  assert.ok(Math.abs(adr * occ - revpar) <= 200, `${label}: RevPAR ≈ ADR × occupancy`);
  assert.ok(o.byDay.every((d) => d.ratio >= 0 && d.ratio <= 1));
  console.log(label, { days: o.byDay.length, occ: occ.toFixed(3), adr: adr / 100, revpar: revpar / 100, nights, byType: o.byRoomType.map((r) => `${r.name} ${r.ratio.toFixed(2)}`) });
}
assert.equal((await getReports("x", p({ from: "2027-01-01", to: "2027-01-31" }))).occupancy, null);
console.log("all checks passed");
