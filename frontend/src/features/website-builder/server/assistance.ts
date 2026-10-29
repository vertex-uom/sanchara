import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client/server";
import { staffFetch } from "@/lib/auth/current-staff";
import type { AssistanceRequest } from "../assistance-options";

// The company's open WEMIXT request, or null. Owner and Manager only; anyone
// else is sent to /forbidden (the API refuses them too).
export async function getAssistanceRequest(): Promise<AssistanceRequest | null> {
  try {
    const { request } = await staffFetch<{ request: AssistanceRequest | null }>("/v1/website/assistance-request");
    return request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/forbidden");
    throw error;
  }
}
