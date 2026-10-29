import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";
import type { Announcement, AnnouncementAudience, AnnouncementStatus, AnnouncementType, Paged } from "../types";

// Announcements from the platform-admin API (docs/announcements-api-contract.md).
// Delivered to staff as system notifications by the notifications module.

// GET /v1/admin/announcements/:id and the list items.
export type AnnouncementResponse = {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  dismissible: boolean;
  status: AnnouncementStatus;
  startsAt: string;
  endsAt: string | null;
  createdBy: { id: string; fullName: string } | null;
  createdAt: string;
  archivedAt: string | null;
  archivedBy: { id: string; fullName: string } | null;
  publishedAt: string | null;
  withdrawnAt: string | null;
};

export function toAnnouncement(a: AnnouncementResponse): Announcement {
  return {
    id: a.id,
    title: a.title,
    message: a.message,
    type: a.type,
    audience: a.audience,
    dismissible: a.dismissible,
    status: a.status,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    createdBy: a.createdBy?.fullName ?? "Removed admin",
    createdAt: a.createdAt,
    archivedAt: a.archivedAt,
    publishedAt: a.publishedAt,
    withdrawnAt: a.withdrawnAt,
  };
}

export type AnnouncementCounts = Record<AnnouncementStatus, number>;

export function getAnnouncementCounts(): Promise<AnnouncementCounts> {
  return adminFetch<AnnouncementCounts>("/v1/admin/announcements/summary");
}

// Active: newest start first. Scheduled: soonest first. Archived: most
// recently ended first.
export async function listAnnouncements(status: AnnouncementStatus, page: number): Promise<Paged<Announcement>> {
  const result = await adminFetch<Paged<AnnouncementResponse>>(`/v1/admin/announcements?status=${status}&page=${page}`);
  return { ...result, items: result.items.map(toAnnouncement) };
}

// Null for an unknown or malformed id.
export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    return toAnnouncement(await adminFetch<AnnouncementResponse>(`/v1/admin/announcements/${encodeURIComponent(id)}`));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

// For the Overview card.
export async function getActiveAnnouncements(limit = 4): Promise<Announcement[]> {
  const { items } = await listAnnouncements("active", 1);
  return items.slice(0, limit);
}
