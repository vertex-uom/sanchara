// The WEMIXT assistance request: the fixed choices (same keys as the API,
// website-assistance.policy.ts) and the request as the API returns it.

export const ASSISTANCE_GOALS = [
  { value: "direct-bookings", label: "Get direct bookings" },
  { value: "rooms-prices", label: "Show rooms & prices" },
  { value: "photo-gallery", label: "Photo gallery" },
  { value: "multi-language", label: "Multi-language" },
  { value: "local-experiences", label: "Local experiences" },
  { value: "online-payments", label: "Online payments" },
  { value: "guest-reviews", label: "Guest reviews" },
] as const;

export const ASSISTANCE_STYLES = [
  { value: "coastal", label: "Coastal & relaxed" },
  { value: "modern", label: "Modern & minimal" },
  { value: "luxury", label: "Luxury & elegant" },
  { value: "cozy", label: "Cozy & traditional" },
] as const;

export const ASSISTANCE_TIMINGS = [
  { value: "one-week", label: "Within 1 week" },
  { value: "two-weeks", label: "Within 2 weeks" },
  { value: "one-month", label: "Within a month" },
  { value: "no-rush", label: "No rush" },
] as const;

export const CONTACT_METHODS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
] as const;

export type AssistanceStyle = (typeof ASSISTANCE_STYLES)[number]["value"];
export type AssistanceTiming = (typeof ASSISTANCE_TIMINGS)[number]["value"];
export type ContactMethod = (typeof CONTACT_METHODS)[number]["value"];

// What the company sees of its request while it is open.
export type AssistanceRequestStatus = "requested" | "in-progress" | "review";

export const ASSISTANCE_STATUS_LABELS: Record<AssistanceRequestStatus, string> = {
  requested: "Sent",
  "in-progress": "In progress",
  review: "In review",
};

// The form's fields, as sent to the API.
export type AssistanceRequestInput = {
  contactName: string;
  phone: string;
  email: string;
  contactMethod: ContactMethod;
  goals: string[];
  style: AssistanceStyle;
  timing: AssistanceTiming;
  notes: string;
};

export type AssistanceRequest = AssistanceRequestInput & {
  id: string;
  reference: string;
  status: AssistanceRequestStatus;
  propertyName: string | null;
  requestedAt: string;
  updatedAt: string;
};

export const NOTES_MAX = 600;

export function labelOf(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

// "Bookings, rooms, gallery" from the chosen goals.
export function goalsSummary(goals: string[]) {
  const short: Record<string, string> = {
    "direct-bookings": "bookings",
    "rooms-prices": "rooms",
    "photo-gallery": "gallery",
    "multi-language": "languages",
    "local-experiences": "experiences",
    "online-payments": "payments",
    "guest-reviews": "reviews",
  };
  const text = goals.map((goal) => short[goal] ?? goal).join(", ");
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}
