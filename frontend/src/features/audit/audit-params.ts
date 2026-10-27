import { STAFF_ROLES, type StaffRole } from "@/lib/auth/staff";
import { isValidDateRange, monthRange } from "@/lib/format/dates";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { AUDIT_ACTIONS, AUDIT_CATEGORIES } from "./config";
import type { AuditAction, AuditCategory } from "./types";

// Audit page state lives in the URL: ?category, ?from, ?to, ?staff, ?role,
// ?action, ?q, ?page and the open record ?entry=<id>.

export type AuditFilters = {
  category: AuditCategory | null;
  from: string;
  to: string;
  // True when from/to came from the URL; the default is the current month.
  customRange: boolean;
  staffId: string | null;
  role: StaffRole | null;
  action: AuditAction | null;
  q: string;
  page: number;
};

export type AuditParams = AuditFilters & { entryId: string | null };

// Records are kept for 1 year, so a range never needs to be longer.
const MAX_RANGE_DAYS = 366;
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 1000;
const ID = /^[a-z0-9_-]{1,64}$/;

function id(value: string | undefined) {
  return value && ID.test(value) ? value : null;
}

// Whitelists the URL; anything invalid falls back to the default
// (this month, everything else unfiltered, page 1, no open record).
export function parseAuditParams(query: SearchParams, today: string): AuditParams {
  const from = single(query.from);
  const to = single(query.to);
  const customRange = Boolean(from && to && isValidDateRange(from, to, MAX_RANGE_DAYS));
  const page = Number(single(query.page));
  const staffId = id(single(query.staff));
  return {
    category: AUDIT_CATEGORIES.find((category) => category === single(query.category)) ?? null,
    ...(customRange ? { from: from as string, to: to as string } : monthRange(today)),
    customRange,
    staffId,
    // Staff and role are alternatives; a person wins if a URL has both.
    role: staffId ? null : (STAFF_ROLES.find((role) => role === single(query.role)) ?? null),
    action: AUDIT_ACTIONS.find((action) => action === single(query.action)) ?? null,
    q: (single(query.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    entryId: id(single(query.entry)),
  };
}

// Audit page link that keeps the filters. Changing the category starts at page 1.
export function auditHref(
  filters: AuditFilters,
  change: { category?: AuditCategory | null; page?: number; entryId?: string } = {},
) {
  const category = change.category === undefined ? filters.category : change.category;
  const page = change.page ?? (change.category === undefined ? filters.page : 1);
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (filters.customRange) {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }
  if (filters.staffId) params.set("staff", filters.staffId);
  if (filters.role) params.set("role", filters.role);
  if (filters.action) params.set("action", filters.action);
  if (filters.q) params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  if (change.entryId) params.set("entry", change.entryId);
  const query = params.toString();
  return query ? `${COMPANY_PATHS.audit}?${query}` : COMPANY_PATHS.audit;
}
