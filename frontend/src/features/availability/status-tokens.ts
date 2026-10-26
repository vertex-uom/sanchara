import { Ban, Circle, Users, type LucideIcon } from "lucide-react";
import type { UnitStatus } from "./types";

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

// Block-conflict warning box in the Block dates panel.
export const CONFLICT_BOX = {
  container: "border border-office-danger bg-office-danger-soft",
  title: "text-office-danger-text",
  icon: "text-office-danger",
};
