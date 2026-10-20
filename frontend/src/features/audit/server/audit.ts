import type { StaffRole } from "@/lib/auth/staff";
import type { AuditFilters } from "../audit-params";
import { AUDIT_PAGE_SIZE } from "../config";
import type { AuditPage, AuditRecord, AuditValue } from "../types";
import { buildAuditPage } from "./audit-query";

const PALM = "palm-breeze";
const LAGOON = "lagoon-view";

const text = (value: string): AuditValue => ({ kind: "text", text: value });
const date = (value: string): AuditValue => ({ kind: "date", date: value });
const lkr = (rupees: number): AuditValue => ({ kind: "money", money: { amountMinor: rupees * 100, currency: "LKR" } });

const actor = (id: string, name: string, role: StaffRole) => ({ id, name, role });
// Roles as they were at the time. Kamala Silva was Front Desk until 11 Oct.
const MINDULI = actor("staff_1", "Minduli Kumaranayaka", "owner");
const NISAL = actor("staff_2", "Nisal Perera", "manager");
const ANJI = actor("staff_3", "Anji Silva", "front-desk");
const RANDULA = actor("staff_4", "Randula Thilakarathne", "front-desk");
const KAMALA_FRONT_DESK = actor("staff_6", "Kamala Silva", "front-desk");
const KAMALA_MANAGER = actor("staff_6", "Kamala Silva", "manager");

// TEMPORARY fixture, newest first. It follows the role model: Front Desk only
// touches reservations, payments, refunds and blocks; only an Owner or Manager
// changes staff accounts, and a Manager only creates Front Desk accounts.
const ENTRIES: AuditRecord[] = [
  {
    id: "aud_041", category: "reservation", action: "updated", occurredAt: "2026-10-18T10:24:00+05:30", actor: NISAL,
    title: "Reservation #SN-2041 updated", record: "Reservation #SN-2041",
    summary: "Check-out 21 Oct → 23 Oct · Unit Room 3 → Room 5", propertyId: PALM, unit: "Room 3 → Room 5",
    changes: [
      { field: "Check-in", before: date("2026-10-18"), after: date("2026-10-18") },
      { field: "Check-out", before: date("2026-10-21"), after: date("2026-10-23") },
      { field: "Unit", before: text("Room 3"), after: text("Room 5") },
      { field: "No. of guests", before: text("2"), after: text("2") },
      { field: "Total amount", before: lkr(55_400), after: lkr(92_100) },
      { field: "Status", before: text("Confirmed"), after: text("Confirmed") },
    ],
  },
  {
    id: "aud_040", category: "reservation", action: "updated", occurredAt: "2026-10-18T08:05:00+05:30", actor: ANJI,
    title: "Reservation #SN-2040 updated", record: "Reservation #SN-2040", summary: "Guests 2 → 3",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "No. of guests", before: text("2"), after: text("3") },
      { field: "Total amount", before: lkr(36_000), after: lkr(40_500) },
    ],
  },
  {
    id: "aud_039", category: "refund", action: "created", occurredAt: "2026-10-17T16:15:00+05:30", actor: KAMALA_MANAGER,
    title: "Refund #RF-0092 created", record: "Refund #RF-0092", summary: "Refunded LKR 12,300 · Card",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2033") },
      { field: "Amount", before: null, after: lkr(12_300) },
      { field: "Method", before: null, after: text("Card") },
      { field: "Status", before: null, after: text("Refunded") },
    ],
  },
  {
    id: "aud_038", category: "rate", action: "deleted", occurredAt: "2026-10-17T09:40:00+05:30", actor: KAMALA_MANAGER,
    title: "Rate Family Suite – Promo deleted", record: "Family Suite – Promo", summary: "Deleted promo rate · LKR 21,000",
    propertyId: PALM, unit: null,
    changes: [
      { field: "Nightly rate", before: lkr(21_000), after: null },
      { field: "Valid", before: text("01 Nov – 30 Nov"), after: null },
    ],
  },
  {
    id: "aud_037", category: "block", action: "created", occurredAt: "2026-10-16T15:20:00+05:30", actor: ANJI,
    title: "Block on Room 6 created", record: "Room 6", summary: "Blocked 22 Oct – 22 Oct · Owner use",
    propertyId: PALM, unit: "Room 6",
    changes: [
      { field: "From", before: null, after: date("2026-10-22") },
      { field: "To", before: null, after: date("2026-10-22") },
      { field: "Reason", before: null, after: text("Owner use") },
    ],
  },
  {
    id: "aud_036", category: "staff", action: "created", occurredAt: "2026-10-16T11:02:00+05:30", actor: MINDULI,
    title: "Staff account created", record: "Staff: Ruvini Dissanayake", summary: "New staff account created",
    propertyId: null, unit: null,
    changes: [
      { field: "Name", before: null, after: text("Ruvini Dissanayake") },
      { field: "Email", before: null, after: text("ruvini@example.com") },
      { field: "Role", before: null, after: text("Front Desk") },
      { field: "Status", before: null, after: text("Active") },
    ],
  },
  {
    id: "aud_035", category: "staff", action: "created", occurredAt: "2026-10-15T12:10:00+05:30", actor: NISAL,
    title: "Staff account created", record: "Staff: Tharindu Jayasuriya", summary: "New Front Desk account created",
    propertyId: null, unit: null,
    changes: [
      { field: "Name", before: null, after: text("Tharindu Jayasuriya") },
      { field: "Email", before: null, after: text("tharindu@example.com") },
      { field: "Role", before: null, after: text("Front Desk") },
      { field: "Status", before: null, after: text("Active") },
    ],
  },
  {
    id: "aud_034", category: "block", action: "created", occurredAt: "2026-10-15T09:18:00+05:30", actor: NISAL,
    title: "Block on Room 2 created", record: "Room 2", summary: "Blocked 20 Oct – 25 Oct · Maintenance",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "From", before: null, after: date("2026-10-20") },
      { field: "To", before: null, after: date("2026-10-25") },
      { field: "Reason", before: null, after: text("Maintenance") },
    ],
  },
  {
    id: "aud_033", category: "payment", action: "created", occurredAt: "2026-10-14T15:46:00+05:30", actor: ANJI,
    title: "Payment #PM-4410 created", record: "Payment #PM-4410", summary: "LKR 42,300 · Bank transfer",
    propertyId: PALM, unit: "Room 1",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2039") },
      { field: "Amount", before: null, after: lkr(42_300) },
      { field: "Method", before: null, after: text("Bank transfer") },
      { field: "Status", before: null, after: text("Received") },
    ],
  },
  {
    id: "aud_032", category: "rate", action: "updated", occurredAt: "2026-10-13T14:11:00+05:30", actor: MINDULI,
    title: "Rate Deluxe Double – Peak updated", record: "Deluxe Double – Peak", summary: "Rate LKR 18,000 → LKR 19,500",
    propertyId: PALM, unit: null,
    changes: [{ field: "Nightly rate", before: lkr(18_000), after: lkr(19_500) }],
  },
  {
    id: "aud_031", category: "reservation", action: "updated", occurredAt: "2026-10-12T18:30:00+05:30", actor: KAMALA_MANAGER,
    title: "Reservation #SN-2035 updated", record: "Reservation #SN-2035", summary: "Status Confirmed → Cancelled",
    propertyId: PALM, unit: "Room 4",
    changes: [{ field: "Status", before: text("Confirmed"), after: text("Cancelled") }],
  },
  {
    id: "aud_030", category: "staff", action: "updated", occurredAt: "2026-10-11T10:03:00+05:30", actor: MINDULI,
    title: "Staff role changed", record: "Staff: Kamala Silva", summary: "Role Front Desk → Manager",
    propertyId: null, unit: null,
    changes: [{ field: "Role", before: text("Front Desk"), after: text("Manager") }],
  },
  {
    id: "aud_029", category: "payment", action: "created", occurredAt: "2026-10-10T11:15:00+05:30", actor: ANJI,
    title: "Payment #PM-4401 created", record: "Payment #PM-4401", summary: "LKR 18,500 · Card",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2037") },
      { field: "Amount", before: null, after: lkr(18_500) },
      { field: "Method", before: null, after: text("Card") },
      { field: "Status", before: null, after: text("Received") },
    ],
  },
  {
    id: "aud_028", category: "reservation", action: "created", occurredAt: "2026-10-09T13:27:00+05:30", actor: ANJI,
    title: "Reservation #SN-2038 created", record: "Reservation #SN-2038", summary: "New reservation · Room 4 · 15 Oct – 17 Oct",
    propertyId: PALM, unit: "Room 4",
    changes: [
      { field: "Check-in", before: null, after: date("2026-10-15") },
      { field: "Check-out", before: null, after: date("2026-10-17") },
      { field: "Unit", before: null, after: text("Room 4") },
      { field: "No. of guests", before: null, after: text("2") },
      { field: "Total amount", before: null, after: lkr(34_000) },
      { field: "Status", before: null, after: text("Confirmed") },
    ],
  },
  {
    id: "aud_027", category: "staff", action: "updated", occurredAt: "2026-10-08T14:00:00+05:30", actor: MINDULI,
    title: "Staff account deactivated", record: "Staff: Randula Thilakarathne", summary: "Status Active → Inactive",
    propertyId: null, unit: null,
    changes: [{ field: "Status", before: text("Active"), after: text("Inactive") }],
  },
  {
    id: "aud_026", category: "payment", action: "updated", occurredAt: "2026-10-07T17:41:00+05:30", actor: KAMALA_FRONT_DESK,
    title: "Payment #PM-4392 updated", record: "Payment #PM-4392", summary: "Status Pending → Paid · LKR 28,000",
    propertyId: PALM, unit: "Room 3",
    changes: [
      { field: "Amount", before: lkr(28_000), after: lkr(28_000) },
      { field: "Status", before: text("Pending"), after: text("Paid") },
    ],
  },
  {
    id: "aud_025", category: "reservation", action: "created", occurredAt: "2026-10-06T10:45:00+05:30", actor: NISAL,
    title: "Reservation #SN-2036 created", record: "Reservation #SN-2036", summary: "New reservation · Room 2 · 9 Oct – 11 Oct",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "Check-in", before: null, after: date("2026-10-09") },
      { field: "Check-out", before: null, after: date("2026-10-11") },
      { field: "Unit", before: null, after: text("Room 2") },
      { field: "Total amount", before: null, after: lkr(36_000) },
      { field: "Status", before: null, after: text("Confirmed") },
    ],
  },
  {
    id: "aud_024", category: "block", action: "deleted", occurredAt: "2026-10-05T09:22:00+05:30", actor: MINDULI,
    title: "Block on Room 1 deleted", record: "Room 1", summary: "Deleted block 10 Oct – 12 Oct",
    propertyId: PALM, unit: "Room 1",
    changes: [
      { field: "From", before: date("2026-10-10"), after: null },
      { field: "To", before: date("2026-10-12"), after: null },
      { field: "Reason", before: text("Painting"), after: null },
    ],
  },
  {
    id: "aud_023", category: "rate", action: "created", occurredAt: "2026-10-04T16:18:00+05:30", actor: NISAL,
    title: "Rate Standard Room – Shoulder created", record: "Standard Room – Shoulder", summary: "New seasonal rate · LKR 12,000",
    propertyId: PALM, unit: null,
    changes: [
      { field: "Nightly rate", before: null, after: lkr(12_000) },
      { field: "Season", before: null, after: text("Shoulder") },
    ],
  },
  {
    id: "aud_022", category: "refund", action: "created", occurredAt: "2026-10-03T11:35:00+05:30", actor: ANJI,
    title: "Refund #RF-0091 created", record: "Refund #RF-0091", summary: "Refunded LKR 5,600 · Cash",
    propertyId: PALM, unit: "Room 4",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2029") },
      { field: "Amount", before: null, after: lkr(5_600) },
      { field: "Method", before: null, after: text("Cash") },
      { field: "Status", before: null, after: text("Refunded") },
    ],
  },
  {
    id: "aud_021", category: "rate", action: "updated", occurredAt: "2026-10-02T15:30:00+05:30", actor: MINDULI,
    title: "Rate Deluxe Double – Standard updated", record: "Deluxe Double – Standard", summary: "Rate LKR 16,500 → LKR 17,000",
    propertyId: PALM, unit: null,
    changes: [{ field: "Nightly rate", before: lkr(16_500), after: lkr(17_000) }],
  },
  {
    id: "aud_020", category: "payment", action: "updated", occurredAt: "2026-10-01T09:00:00+05:30", actor: KAMALA_FRONT_DESK,
    title: "Payment #PM-4388 updated", record: "Payment #PM-4388", summary: "Method Cash → Card",
    propertyId: PALM, unit: "Room 5",
    changes: [{ field: "Method", before: text("Cash"), after: text("Card") }],
  },
  {
    id: "aud_019", category: "refund", action: "created", occurredAt: "2026-09-28T16:00:00+05:30", actor: NISAL,
    title: "Refund #RF-0090 created", record: "Refund #RF-0090", summary: "Refunded LKR 9,800 · Card",
    propertyId: PALM, unit: "Room 3",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2026") },
      { field: "Amount", before: null, after: lkr(9_800) },
      { field: "Method", before: null, after: text("Card") },
      { field: "Status", before: null, after: text("Refunded") },
    ],
  },
  {
    id: "aud_018", category: "reservation", action: "created", occurredAt: "2026-09-25T11:20:00+05:30", actor: RANDULA,
    title: "Reservation #SN-2030 created", record: "Reservation #SN-2030", summary: "New reservation · Room 1 · 2 Oct – 4 Oct",
    propertyId: PALM, unit: "Room 1",
    changes: [
      { field: "Check-in", before: null, after: date("2026-10-02") },
      { field: "Check-out", before: null, after: date("2026-10-04") },
      { field: "Total amount", before: null, after: lkr(32_000) },
      { field: "Status", before: null, after: text("Confirmed") },
    ],
  },
  {
    id: "aud_017", category: "staff", action: "created", occurredAt: "2026-09-20T10:00:00+05:30", actor: MINDULI,
    title: "Staff account created", record: "Staff: Kamala Silva", summary: "New Front Desk account created",
    propertyId: null, unit: null,
    changes: [
      { field: "Name", before: null, after: text("Kamala Silva") },
      { field: "Email", before: null, after: text("kamala@example.com") },
      { field: "Role", before: null, after: text("Front Desk") },
      { field: "Status", before: null, after: text("Active") },
    ],
  },
  {
    id: "aud_016", category: "block", action: "deleted", occurredAt: "2026-09-15T14:45:00+05:30", actor: RANDULA,
    title: "Block on Room 4 deleted", record: "Room 4", summary: "Deleted block 18 Sep – 19 Sep",
    propertyId: PALM, unit: "Room 4",
    changes: [
      { field: "From", before: date("2026-09-18"), after: null },
      { field: "To", before: date("2026-09-19"), after: null },
    ],
  },
  {
    id: "aud_015", category: "reservation", action: "created", occurredAt: "2026-09-08T12:05:00+05:30", actor: ANJI,
    title: "Reservation #SN-2027 created", record: "Reservation #SN-2027", summary: "New reservation · Room 6 · 12 Sep – 14 Sep",
    propertyId: PALM, unit: "Room 6",
    changes: [
      { field: "Check-in", before: null, after: date("2026-09-12") },
      { field: "Check-out", before: null, after: date("2026-09-14") },
      { field: "Total amount", before: null, after: lkr(30_000) },
    ],
  },
  {
    id: "aud_014", category: "rate", action: "updated", occurredAt: "2026-09-05T09:50:00+05:30", actor: NISAL,
    title: "Rate Standard Room – Standard updated", record: "Standard Room – Standard", summary: "Rate LKR 11,000 → LKR 11,500",
    propertyId: PALM, unit: null,
    changes: [{ field: "Nightly rate", before: lkr(11_000), after: lkr(11_500) }],
  },
  {
    id: "aud_013", category: "payment", action: "created", occurredAt: "2026-09-03T17:10:00+05:30", actor: ANJI,
    title: "Payment #PM-4350 created", record: "Payment #PM-4350", summary: "LKR 15,000 · Cash",
    propertyId: PALM, unit: "Room 6",
    changes: [
      { field: "Reservation", before: null, after: text("#SN-2027") },
      { field: "Amount", before: null, after: lkr(15_000) },
      { field: "Method", before: null, after: text("Cash") },
    ],
  },
  {
    id: "aud_012", category: "reservation", action: "updated", occurredAt: "2026-09-01T08:40:00+05:30", actor: RANDULA,
    title: "Reservation #SN-2025 updated", record: "Reservation #SN-2025", summary: "Check-in 3 Sep → 4 Sep",
    propertyId: PALM, unit: "Room 2",
    changes: [
      { field: "Check-in", before: date("2026-09-03"), after: date("2026-09-04") },
      { field: "Total amount", before: lkr(36_000), after: lkr(18_000) },
    ],
  },
  // Another property; hidden on Palm Breeze.
  {
    id: "aud_011", category: "reservation", action: "created", occurredAt: "2026-10-17T12:00:00+05:30", actor: NISAL,
    title: "Reservation #LV-1012 created", record: "Reservation #LV-1012", summary: "New reservation · Villa · 24 Oct – 27 Oct",
    propertyId: LAGOON, unit: "Villa",
    changes: [{ field: "Total amount", before: null, after: lkr(120_000) }],
  },
  {
    id: "aud_010", category: "payment", action: "created", occurredAt: "2026-10-12T10:30:00+05:30", actor: ANJI,
    title: "Payment #PM-5003 created", record: "Payment #PM-5003", summary: "LKR 60,000 · Card",
    propertyId: LAGOON, unit: "Villa",
    changes: [{ field: "Amount", before: null, after: lkr(60_000) }],
  },
];

// Company-wide records (staff accounts) show on every property.
const inScope = (propertyId: string) =>
  ENTRIES.filter((entry) => entry.propertyId === propertyId || entry.propertyId === null);

// TEMPORARY fixture. Replace the bodies with the audit API calls once the
// API client exists; the return types stay the same.
export async function getAuditPage(propertyId: string, filters: AuditFilters): Promise<AuditPage> {
  return buildAuditPage(inScope(propertyId), filters, AUDIT_PAGE_SIZE);
}

export async function getAuditEntry(propertyId: string, id: string): Promise<AuditRecord | null> {
  return inScope(propertyId).find((entry) => entry.id === id) ?? null;
}
