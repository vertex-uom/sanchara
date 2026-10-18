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
