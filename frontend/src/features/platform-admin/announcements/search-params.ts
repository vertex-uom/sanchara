import { adminNavItem } from "../nav";
import type { AnnouncementStatus } from "../types";

// The Announcements list state (section, page) lives in the URL so it
// survives reloads and opening an announcement in the side panel.

export type SearchParams = Record<string, string | string[] | undefined>;

export const SECTIONS: readonly AnnouncementStatus[] = ["active", "scheduled", "archived"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSection(params: SearchParams): AnnouncementStatus {
  const value = first(params.tab);
  return SECTIONS.includes(value as AnnouncementStatus) ? (value as AnnouncementStatus) : "active";
}

export function parsePage(params: SearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
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
