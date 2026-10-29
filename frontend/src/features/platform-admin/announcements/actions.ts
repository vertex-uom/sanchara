"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch, requireAdmin } from "@/lib/auth/admin";
import type { AnnouncementResponse } from "../server/announcements";
import type { AnnouncementAudience, AnnouncementStatus, AnnouncementType } from "../types";

// Create, edit (scheduled only) and archive announcements through the
// platform-admin API. Delivery is the API's job: it raises the event that the
// notifications module turns into a system notification.

export type AnnouncementInput = {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  dismissible: boolean;
  // ISO with offset; null = now (create) / keep it starting now.
  startsAt: string | null;
  // ISO with offset; null = until archived.
  endsAt: string | null;
};

export type AnnouncementField = keyof AnnouncementInput;
export type SaveResult = { ok: true; id: string; status: AnnouncementStatus } | { ok: false; message: string; fieldErrors: Partial<Record<AnnouncementField, string>> };
export type ArchiveResult = { ok: true } | { ok: false; message: string };

const FIELDS: readonly AnnouncementField[] = ["title", "message", "type", "audience", "dismissible", "startsAt", "endsAt"];
const GENERIC_ERROR = "Something went wrong. Please try again.";
// App route behind the proxy rewrite; also refreshes the Overview card.
const ADMIN_LAYOUT = "/admin";

function toBody(input: AnnouncementInput) {
  const { startsAt, ...rest } = input;
  return startsAt ? { ...rest, startsAt } : rest;
}

function failure(error: ApiError): Extract<SaveResult, { ok: false }> {
  const fieldErrors: Partial<Record<AnnouncementField, string>> = {};
  for (const field of FIELDS) {
    const message = error.fieldErrors[field]?.[0];
    if (message) fieldErrors[field] = message;
  }
  const known = error.code === "VALIDATION_FAILED" || error.code === "ANNOUNCEMENT_LIVE" || error.code === "ANNOUNCEMENT_ARCHIVED" || error.code === "API_UNREACHABLE";
  return { ok: false, message: known ? error.message : GENERIC_ERROR, fieldErrors };
}

export async function createAnnouncement(input: AnnouncementInput): Promise<SaveResult> {
  await requireAdmin();
  try {
    const created = await adminFetch<AnnouncementResponse>("/v1/admin/announcements", { method: "POST", body: toBody(input) });
    revalidatePath(ADMIN_LAYOUT, "layout");
    return { ok: true, id: created.id, status: created.status };
  } catch (error) {
    if (error instanceof ApiError) return failure(error);
    throw error;
  }
}

// Only while it is scheduled; the API answers ANNOUNCEMENT_LIVE once it has started.
export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<SaveResult> {
  await requireAdmin();
  try {
    const updated = await adminFetch<AnnouncementResponse>(`/v1/admin/announcements/${encodeURIComponent(id)}`, { method: "PUT", body: toBody(input) });
    revalidatePath(ADMIN_LAYOUT, "layout");
    return { ok: true, id: updated.id, status: updated.status };
  } catch (error) {
    if (error instanceof ApiError) return failure(error);
    throw error;
  }
}

// Cancels a scheduled announcement or takes a live one down at once.
export async function archiveAnnouncement(id: string): Promise<ArchiveResult> {
  await requireAdmin();
  try {
    await adminFetch(`/v1/admin/announcements/${encodeURIComponent(id)}/archive`, { method: "POST" });
    revalidatePath(ADMIN_LAYOUT, "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.code === "API_UNREACHABLE" ? error.message : GENERIC_ERROR };
    throw error;
  }
}
