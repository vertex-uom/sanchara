import { STAFF_ROLES, type StaffRole } from "@/lib/auth/staff";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { STAFF_ERROR_MESSAGES, type StaffErrorCode } from "./config";

// Staff page state lives in the URL: filters (?role, ?status, ?q) and the open
// panel (?panel=add|role|deactivate with ?staff=<id>, plus ?error after a refusal).

export type StaffFilters = { role: StaffRole | null; inactive: boolean; q: string };

export type StaffPanel = "add" | "role" | "deactivate";

export type StaffParams = StaffFilters & { panel: StaffPanel | null; staffId: string | null; error: StaffErrorCode | null };

const PANELS: StaffPanel[] = ["add", "role", "deactivate"];
const MAX_QUERY_LENGTH = 100;
const STAFF_ID = /^[a-z0-9_-]{1,64}$/;

// Whitelists the URL; anything invalid falls back to "no filter, no panel".
export function parseStaffParams(query: SearchParams): StaffParams {
  const staffId = single(query.staff);
  const error = single(query.error);
  return {
    role: STAFF_ROLES.find((role) => role === single(query.role)) ?? null,
    inactive: single(query.status) === "inactive",
    q: (single(query.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    panel: PANELS.find((panel) => panel === single(query.panel)) ?? null,
    staffId: staffId && STAFF_ID.test(staffId) ? staffId : null,
    error: error && Object.hasOwn(STAFF_ERROR_MESSAGES, error) ? (error as StaffErrorCode) : null,
  };
}

// Staff page link that keeps the filters; pass a panel to open it.
export function staffHref(filters: StaffFilters, open: { panel?: StaffPanel; staffId?: string; error?: StaffErrorCode } = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.inactive) params.set("status", "inactive");
  if (filters.q) params.set("q", filters.q);
  if (open.panel) params.set("panel", open.panel);
  if (open.staffId) params.set("staff", open.staffId);
  if (open.error) params.set("error", open.error);
  const query = params.toString();
  return query ? `${COMPANY_PATHS.staff}?${query}` : COMPANY_PATHS.staff;
}

// Server Actions get the list URL from a form field; only staff page URLs are
// accepted, rebuilt from their whitelisted filters.
export function safeStaffFilters(returnTo: string): StaffFilters {
  const url = new URL(returnTo, "http://staff.invalid");
  const sameSite = url.origin === "http://staff.invalid" && url.pathname === COMPANY_PATHS.staff;
  const { role, inactive, q } = parseStaffParams(sameSite ? Object.fromEntries(url.searchParams) : {});
  return { role, inactive, q };
}
