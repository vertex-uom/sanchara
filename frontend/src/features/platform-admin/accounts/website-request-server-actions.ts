"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";
import type { WebsiteRequestStatus } from "../types";

// Result of a website request action; the dialog closes on ok.
export type WebsiteRequestActionResult = { ok: true } | { ok: false; message: string };

const REQUEST_ID = /^[0-9a-f-]{36}$/i;

function failed(error: unknown): WebsiteRequestActionResult {
  if (!(error instanceof ApiError)) throw error;
  const field = Object.values(error.fieldErrors)[0]?.[0];
  if (field) return { ok: false, message: field };
  if (error.code === "REQUEST_CLOSED" || error.code === "NOT_FOUND") return { ok: false, message: error.message };
  return { ok: false, message: "Something went wrong. Please try again." };
}

async function change(id: string, path: string, method: "PUT" | "POST", body: unknown): Promise<WebsiteRequestActionResult> {
  if (!REQUEST_ID.test(id)) return { ok: false, message: "That website request no longer exists." };
  try {
    await adminFetch(`/v1/admin/website-requests/${id}${path}`, { method, body });
  } catch (error) {
    return failed(error);
  }
  revalidatePath("/admin/accounts", "layout");
  return { ok: true };
}

export async function setWebsiteRequestStatus(id: string, status: WebsiteRequestStatus | "published", note: string) {
  return change(id, "/status", "PUT", { status, note });
}

// "" unassigns.
export async function assignWebsiteRequest(id: string, adminId: string) {
  return change(id, "/assignee", "PUT", { adminId: adminId || null });
}

export async function addWebsiteRequestNote(id: string, text: string) {
  return change(id, "/notes", "POST", { text });
}
