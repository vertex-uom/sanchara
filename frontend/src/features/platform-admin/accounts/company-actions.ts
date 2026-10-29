"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";

// Result of Suspend / Reactivate; the dialog closes on ok.
export type CompanyActionResult = { ok: true } | { ok: false; message: string };

const COMPANY_ID = /^[0-9a-f-]{36}$/i;

async function changeStatus(id: string, action: "suspend" | "reactivate", reason: string): Promise<CompanyActionResult> {
  if (!COMPANY_ID.test(id)) return { ok: false, message: "That company no longer exists." };
  try {
    await adminFetch(`/v1/admin/companies/${id}/${action}`, { method: "POST", body: { reason } });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const field = Object.values(error.fieldErrors)[0]?.[0];
    if (field) return { ok: false, message: field };
    if (error.code === "INVALID_STATUS" || error.code === "CONFLICT" || error.code === "NOT_FOUND") return { ok: false, message: error.message };
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  revalidatePath("/admin/accounts", "layout");
  return { ok: true };
}

// `reason` is the chosen category plus the note, e.g. "Fraud · chargeback pattern".
export async function suspendCompany(id: string, reason: string) {
  return changeStatus(id, "suspend", reason);
}

export async function reactivateCompany(id: string, reason: string) {
  return changeStatus(id, "reactivate", reason);
}
