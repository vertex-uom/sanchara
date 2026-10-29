"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";

const MESSAGE_ID = /^[0-9a-f-]{36}$/i;

// Marks a contact message handled, or reopens it. Returns an error message, or null.
export async function markContactMessage(id: string, handled: boolean): Promise<string | null> {
  if (!MESSAGE_ID.test(id)) return "That message no longer exists.";
  try {
    await adminFetch(`/v1/admin/contact-messages/${id}/handled`, { method: "PUT", body: { handled } });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return error.code === "NOT_FOUND" ? error.message : "Something went wrong. Please try again.";
  }
  revalidatePath("/admin/contact-messages");
  return null;
}
