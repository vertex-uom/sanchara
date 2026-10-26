import { Ban, Circle, CircleCheck, Clock, Users, type LucideIcon } from "lucide-react";
import type { ConflictStatus, UnitStatus } from "./types";

// The one place availability status colours live. Classes map to the Back
// Office palette in globals.css; components never pick status colours.
// Status is always shown as icon + text, never colour alone.
export type StatusToken = {
  label: string;
  icon: LucideIcon;
  // Filled dot icons (available, held, booked) use the icon class as fill too.
  filledIcon: boolean;
  chip: string;
  text: string;
  iconColor: string;
};

export const STATUS_TOKENS: Record<UnitStatus, StatusToken> = {
  available: {
    label: "Available",
    icon: Circle,
    filledIcon: true,
    chip: "bg-office-success-soft",
    text: "text-office-success-text",
    iconColor: "text-office-success-dot fill-office-success-dot",
  },
  held: {
    label: "Held",
    icon: Circle,
    filledIcon: true,
    chip: "bg-office-tint-orange",
    text: "text-office-label",
    iconColor: "text-office-ink-orange fill-office-ink-orange",
  },
  booked: {
    label: "Booked",
    icon: Circle,
    filledIcon: true,
    chip: "bg-office-danger-soft",
    text: "text-office-danger-text",
    iconColor: "text-office-danger fill-office-danger",
  },
  blocked: {
    label: "Blocked",
    icon: Ban,
    filledIcon: false,
    chip: "bg-office-chip",
    text: "text-office-label",
    iconColor: "text-office-muted",
  },
  capacity_too_small: {
    label: "Capacity too small",
    icon: Users,
    filledIcon: false,
    chip: "bg-office-chip",
    text: "text-office-label",
    iconColor: "text-office-muted",
  },
};

// 2px Fresh Teal focus ring for this page (the shared focus-ring utility
// reads --focus-ring). Put on the page root and on anything portalled out.
export const FOCUS_SCOPE = "[--focus-ring:var(--brand-teal)]";

// Restriction banner shown instead of results (min stay, booking window…).
export const RESTRICTION_BANNER = {
  container: "border border-office-ink-orange/40 bg-office-tint-orange",
  icon: "text-office-ink-orange",
  title: "text-foreground",
};

// Status pill on each conflicting reservation, hold or block.
export const CONFLICT_STATUS_TOKENS: Record<ConflictStatus, { label: string; icon: LucideIcon; pill: string }> = {
  confirmed: { label: "Confirmed", icon: CircleCheck, pill: "bg-office-success-soft text-office-success-text" },
  pending_payment: { label: "Pending payment", icon: Clock, pill: "bg-office-tint-orange text-office-label" },
  enquiry: { label: "Enquiry hold", icon: Clock, pill: "bg-office-tint-orange text-office-label" },
  blocked: { label: "Blocked", icon: Ban, pill: "bg-office-chip text-office-label" },
};

// Block-conflict warning box in the Block dates panel.
export const CONFLICT_BOX = {
  container: "border border-office-danger bg-office-danger-soft",
  title: "text-office-danger-text",
  icon: "text-office-danger",
};
