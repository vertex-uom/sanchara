"use client";

import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";

export const ASSISTANCE_STYLES = [
  "Coastal & relaxed",
  "Modern & minimal",
  "Luxury & elegant",
  "Cozy & traditional",
];
export const ASSISTANCE_TIMINGS = [
  "Within 1 week",
  "Within 2 weeks",
  "Within a month",
  "No rush",
];
export const CONTACT_METHODS = ["WhatsApp", "Phone call", "Email"] as const;

export type AssistanceRequestDraft = {
  name: string;
  phone: string;
  email: string;
  goals: string[];
  style: string;
  timing: string;
  notes: string;
  contactBy: (typeof CONTACT_METHODS)[number];
  // Set when the request is sent; null while it is being written.
  sentAt: string | null;
  requestId: string | null;
};

// The WEMIXT request, kept in this browser until the assistance service
// exists. Shared by the form, the confirmation and the details page.
export function useAssistanceRequest(staffName = "") {
  return useTemplateDraft<AssistanceRequestDraft>(DRAFT_KEYS.assistance, {
    name: staffName,
    phone: "",
    email: "",
    goals: ["Get direct bookings", "Show rooms & prices"],
    style: ASSISTANCE_STYLES[0],
    timing: ASSISTANCE_TIMINGS[1],
    notes: "",
    contactBy: "WhatsApp",
    sentAt: null,
    requestId: null,
  });
}

// "WMX-20481": five digits, made when the request is sent.
export function newRequestId() {
  return `WMX-${String(Math.floor(10_000 + Math.random() * 90_000))}`;
}

// "Bookings, rooms, gallery, reviews" from the chosen goals.
export function goalsSummary(goals: string[]) {
  const short: Record<string, string> = {
    "Get direct bookings": "bookings",
    "Show rooms & prices": "rooms",
    "Photo gallery": "gallery",
    "Multi-language": "languages",
    "Local experiences": "experiences",
    "Online payments": "payments",
    "Guest reviews": "reviews",
  };
  const text = goals
    .map((goal) => short[goal] ?? goal.toLowerCase())
    .join(", ");
  return text ? text[0].toUpperCase() + text.slice(1) : "—";
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}
