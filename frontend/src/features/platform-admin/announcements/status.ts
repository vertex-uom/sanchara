import { CircleAlert, FileText, Info, Wrench, Zap, type LucideIcon } from "lucide-react";
import type { AnnouncementAudience, AnnouncementChannel, AnnouncementStatus, AnnouncementType, Tone } from "../types";

// Labels, tones and icons for announcements. Shared by the list, the detail
// panel, the create dialog and the Overview card so they never disagree.

export const TYPE_META: Record<AnnouncementType, { label: string; tone: Tone; icon: LucideIcon }> = {
  feature: { label: "Feature", tone: "success", icon: Zap },
  maintenance: { label: "Maintenance", tone: "info", icon: Wrench },
  policy: { label: "Policy", tone: "neutral", icon: FileText },
  reminder: { label: "Reminder", tone: "warning", icon: Info },
  urgent: { label: "Urgent", tone: "danger", icon: CircleAlert },
};

export const TYPES: readonly AnnouncementType[] = ["feature", "maintenance", "policy", "reminder", "urgent"];

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  "all-staff": "All staff",
  owners: "Owners",
  managers: "Managers",
  "front-desk": "Front Desk",
};

export const AUDIENCES: readonly AnnouncementAudience[] = ["all-staff", "owners", "managers", "front-desk"];

export const CHANNEL_LABELS: Record<AnnouncementChannel, string> = {
  "in-app": "In-app banner",
  email: "Email",
};

export const CHANNELS: readonly AnnouncementChannel[] = ["in-app", "email"];

export const STATUS_META: Record<AnnouncementStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
  archived: { label: "Archived", tone: "neutral" },
};

// "In-app + email"
export function describeChannels(channels: AnnouncementChannel[]) {
  return channels.map((c) => (c === "in-app" ? "In-app" : "Email")).join(" + ");
}

const TZ = "Asia/Colombo";
const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: TZ });
const dayYear = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: TZ });

const upper = (text: string) => text.replace(/\b(am|pm)\b/, (m) => m.toUpperCase());

// "20 Oct – 03 Nov 2026", "22 Oct, 02:00 AM – 04:00 AM" for same-day windows,
// "From 20 Oct 2026" when open-ended. `compact` drops the year (list column).
export function formatWindow(startsAt: string, endsAt: string | null, compact = false) {
  const start = new Date(startsAt);
  const endFormat = compact ? day : dayYear;
  if (!endsAt) return `From ${endFormat.format(start)}`;
  const end = new Date(endsAt);
  if (day.format(start) === day.format(end)) return `${day.format(start)}, ${upper(time.format(start))} – ${upper(time.format(end))}`;
  return `${day.format(start)} – ${endFormat.format(end)}`;
}

// "18 Oct" for the list's created-by line.
export function formatDay(iso: string) {
  return day.format(new Date(iso));
}

// "20 Oct 2026, 09:00 AM"
export function formatInstant(iso: string) {
  const date = new Date(iso);
  return `${dayYear.format(date)}, ${upper(time.format(date))}`;
}
