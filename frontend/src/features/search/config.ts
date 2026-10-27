import type { ChipTone } from "@/components/ui/tone-chip";
import type { ReservationStatus } from "./types";

// Shortest query sent to the server, and the results kept per group.
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_GROUP_LIMIT = 5;

// Wait after the last keystroke before searching.
export const SEARCH_DEBOUNCE_MS = 250;

export const STATUS_META: Record<ReservationStatus, { label: string; tone: ChipTone }> = {
  "pending-payment": { label: "Pending payment", tone: "info" },
  confirmed: { label: "Confirmed", tone: "success" },
  "checked-in": { label: "Checked in", tone: "success" },
  "checked-out": { label: "Checked out", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  "no-show": { label: "No-show", tone: "danger" },
};
