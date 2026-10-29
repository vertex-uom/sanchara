"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client/server";
import { staffFetch } from "@/lib/auth/current-staff";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import type { AssistanceRequestInput } from "./assistance-options";

const ASSISTANCE_PATH = `${COMPANY_PATHS.website}/assistance`;

// What the form shows after a refused save.
export type AssistanceActionResult = { message?: string; fieldErrors?: Partial<Record<keyof AssistanceRequestInput, string>> };

function toResult(error: unknown): AssistanceActionResult {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 400 && Object.keys(error.fieldErrors).length > 0) {
    return {
      message: "Fix the highlighted fields, then send again.",
      fieldErrors: Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages[0]])),
    };
  }
  if (error.status === 403) return { message: "Only the Owner or a Manager can request WEMIXT assistance." };
  if (error.code === "REQUEST_OPEN" || error.code === "NO_OPEN_REQUEST") return { message: error.message };
  return { message: "Something went wrong. Please try again." };
}

export async function sendAssistanceRequest(input: AssistanceRequestInput): Promise<AssistanceActionResult> {
  try {
    await staffFetch("/v1/website/assistance-request", { method: "POST", body: input });
  } catch (error) {
    return toResult(error);
  }
  redirect(`${ASSISTANCE_PATH}/sent`);
}

export async function updateAssistanceRequest(input: AssistanceRequestInput): Promise<AssistanceActionResult> {
  try {
    await staffFetch("/v1/website/assistance-request", { method: "PUT", body: input });
  } catch (error) {
    return toResult(error);
  }
  redirect(`${ASSISTANCE_PATH}/request`);
}

// Back to the details page, which then offers a new request.
export async function cancelAssistanceRequest(): Promise<AssistanceActionResult> {
  try {
    await staffFetch("/v1/website/assistance-request/cancel", { method: "POST" });
  } catch (error) {
    return toResult(error);
  }
  redirect(`${ASSISTANCE_PATH}/request`);
}
