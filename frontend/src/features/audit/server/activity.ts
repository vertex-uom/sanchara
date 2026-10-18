import type { AuditEntry } from "../types";

// TEMPORARY fixture. Replace the body with the audit trail API call once
// the API client exists; the return type stays the same.
export async function getRecentActivity(propertyId: string, limit = 3): Promise<AuditEntry[]> {
  void propertyId;
  const entries: AuditEntry[] = [
    {
      id: "audit_3",
      kind: "rate",
      title: "Updated room rate",
      detail: "Sea View Room – LKR 28,000",
      occurredAt: "2026-10-18T04:54:00Z",
      actor: { name: "Nisal", roleLabel: "Owner" },
    },
    {
      id: "audit_2",
      kind: "reservation",
      title: "New reservation",
      detail: "#58K-1042 – Sarath Kumara – Room 2",
      occurredAt: "2026-10-18T03:45:00Z",
      actor: { name: "Minduli", roleLabel: "Front Desk" },
    },
    {
      id: "audit_1",
      kind: "payment",
      title: "Payment received",
      detail: "#58K-1041 – LKR 56,000 (PayHere)",
      occurredAt: "2026-10-17T13:12:00Z",
      actor: { name: "Pasindu", roleLabel: "Manager" },
    },
  ];
  return entries.slice(0, limit);
}
