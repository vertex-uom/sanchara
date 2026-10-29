import type { StaffRole } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/audit-logic/lib/auth/staff.ts";
import type { Money } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/audit-logic/lib/format/money.ts";

export type AuditEntryKind = "rate" | "reservation" | "payment" | "refund" | "staff" | "settings" | "other";

// One audit trail entry, already summarised by the API.
export type AuditEntry = {
  id: string;
  kind: AuditEntryKind;
  title: string; // "Updated room rate"
  detail: string; // "Sea View Room – LKR 28,000"
  occurredAt: string; // ISO 8601
  actor: { name: string; roleLabel: string };
};

// Audit Trail page (full records). Categories follow the v8 audit scope.
export type AuditCategory = "rate" | "reservation" | "payment" | "refund" | "block" | "staff";

export type AuditAction = "created" | "updated" | "deleted";

// A Before/After value. Money is in minor units; dates are date-only "YYYY-MM-DD".
export type AuditValue = { kind: "text"; text: string } | { kind: "money"; money: Money } | { kind: "date"; date: string };

export type AuditChange = { field: string; before: AuditValue | null; after: AuditValue | null };

export type AuditRecord = {
  id: string;
  category: AuditCategory;
  action: AuditAction;
  occurredAt: string; // ISO 8601
  // Role as it was when the change was made, not today's role.
  actor: { id: string; name: string; role: StaffRole };
  title: string; // "Reservation #SN-2041 updated"
  record: string; // "Reservation #SN-2041"
  summary: string; // "Check-out 21 Oct → 23 Oct · Unit Room 3 → Room 5"
  propertyId: string | null; // null for company-wide records (staff accounts)
  unit: string | null; // "Room 3 → Room 5"
  changes: AuditChange[];
};

export type AuditPage = {
  entries: AuditRecord[];
  total: number;
  page: number;
  pageSize: number;
  // Per category for the current filters (category itself not applied), so chips match the rows.
  counts: Record<"all" | AuditCategory, number>;
  // People who appear in this property's trail, for the Staff filter.
  actors: { id: string; name: string }[];
};
