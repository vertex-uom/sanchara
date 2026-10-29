import { colomboDateKey } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/audit-logic/lib/format/dates.ts";
import type { AuditFilters } from "../audit-params.ts";
import { AUDIT_CATEGORIES } from "../config.ts";
import type { AuditPage, AuditRecord } from "../types.ts";

// Filtering, counting and paging for the TEMPORARY audit fixture. The audit
// API will do this server-side; these go when the fixture does.

// Every filter except the category, so chip counts can ignore it.
function matchesOtherFilters(entry: AuditRecord, filters: AuditFilters) {
  const day = colomboDateKey(new Date(entry.occurredAt));
  const query = filters.q.toLowerCase();
  return (
    day >= filters.from &&
    day <= filters.to &&
    (!filters.staffId || entry.actor.id === filters.staffId) &&
    (!filters.role || entry.actor.role === filters.role) &&
    (!filters.action || entry.action === filters.action) &&
    (!query || [entry.record, entry.unit ?? "", entry.actor.name].some((text) => text.toLowerCase().includes(query)))
  );
}

export function matchesFilters(entry: AuditRecord, filters: AuditFilters) {
  return (!filters.category || entry.category === filters.category) && matchesOtherFilters(entry, filters);
}

export function countByCategory(entries: AuditRecord[], filters: AuditFilters): AuditPage["counts"] {
  const counts = Object.fromEntries(["all", ...AUDIT_CATEGORIES].map((key) => [key, 0])) as AuditPage["counts"];
  for (const entry of entries) {
    if (!matchesOtherFilters(entry, filters)) continue;
    counts.all += 1;
    counts[entry.category] += 1;
  }
  return counts;
}

// Entries must be newest first. A page past the end shows the last page.
export function buildAuditPage(entries: AuditRecord[], filters: AuditFilters, pageSize: number): AuditPage {
  const matching = entries.filter((entry) => matchesFilters(entry, filters));
  const page = Math.min(filters.page, Math.max(1, Math.ceil(matching.length / pageSize)));
  const actors = [...new Map(entries.map((entry) => [entry.actor.id, entry.actor.name])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    entries: matching.slice((page - 1) * pageSize, page * pageSize),
    total: matching.length,
    page,
    pageSize,
    counts: countByCategory(entries, filters),
    actors,
  };
}
