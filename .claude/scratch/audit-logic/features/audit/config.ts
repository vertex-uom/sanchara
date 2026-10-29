import type { AuditAction, AuditCategory } from "./types.ts";

export const AUDIT_CATEGORIES: readonly AuditCategory[] = ["rate", "reservation", "payment", "refund", "block", "staff"];

export const AUDIT_ACTIONS: readonly AuditAction[] = ["created", "updated", "deleted"];

export const CATEGORY_LABELS: Record<AuditCategory, string> = {
  rate: "Rates",
  reservation: "Reservations",
  payment: "Payments",
  refund: "Refunds",
  block: "Date Blocks",
  staff: "Staff Accounts",
};

export const ACTION_LABELS: Record<AuditAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
};

// TODO(confirm): v8 has not set the audit page size.
export const AUDIT_PAGE_SIZE = 25;
