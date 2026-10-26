// The one place unit status colours live. Classes map to the Back Office
// palette in globals.css; components never pick status colours. Status is
// always shown as dot + text, never colour alone.
export type UnitStatusKey = "active" | "inactive";

export const UNIT_STATUS_TOKENS: Record<UnitStatusKey, { label: string; chip: string; dot: string }> = {
  active: {
    label: "Active",
    chip: "bg-office-success-soft text-office-success-text",
    dot: "text-office-success-dot fill-office-success-dot",
  },
  inactive: {
    label: "Inactive",
    chip: "bg-office-chip text-office-muted",
    dot: "text-office-muted fill-office-muted",
  },
};

// Selected unit card: 2px Fresh Teal ring (a ring, so the keyboard focus
// outline still shows around it).
export const SELECTED_CARD = "ring-2 ring-brand-teal";

// Inactive unit card: faded photo and tinted card; text keeps full contrast.
export const INACTIVE_CARD = { card: "bg-office-chip/40", photo: "opacity-60 grayscale-[40%]" };
