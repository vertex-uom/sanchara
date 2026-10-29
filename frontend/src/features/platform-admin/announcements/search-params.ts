import { type SearchParams, single } from "@/lib/routes/search-params";
import { adminNavItem } from "../nav";
import type { AnnouncementStatus } from "../types";

// The Announcements list state (section, page) lives in the URL so it
// survives reloads and opening an announcement in the side panel.

export const SECTIONS: readonly AnnouncementStatus[] = ["active", "scheduled", "archived"];

export function parseSection(params: SearchParams): AnnouncementStatus {
  const value = single(params.tab);
  return SECTIONS.includes(value as AnnouncementStatus) ? (value as AnnouncementStatus) : "active";
}

function query(section: AnnouncementStatus, page: number) {
  const params = new URLSearchParams();
  if (section !== "active") params.set("tab", section);
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function announcementsHref(section: AnnouncementStatus = "active", page = 1) {
  return `${adminNavItem("announcements").href}${query(section, page)}`;
}

export function announcementHref(id: string, section: AnnouncementStatus = "active", page = 1) {
  return `${adminNavItem("announcements").href}/${encodeURIComponent(id)}${query(section, page)}`;
}
