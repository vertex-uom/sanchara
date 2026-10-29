import "server-only";
import { adminFetch } from "@/lib/auth/admin";
import type { Paged } from "../types";

// Messages from the central site's contact form (GET /v1/admin/contact-messages).

export type ContactMessageStatus = "open" | "handled" | "all";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: "general-inquiry" | "support" | "sales" | "feedback" | "other";
  // Plain text; render as text, never as HTML.
  message: string;
  sentAt: string;
  handledAt: string | null;
  handledBy: string | null;
};

// `open` counts every open message, whatever the filter.
export type ContactMessageList = Paged<ContactMessage> & { open: number };

export function listContactMessages(status: ContactMessageStatus, page: number): Promise<ContactMessageList> {
  const query = new URLSearchParams({ status });
  if (page > 1) query.set("page", String(page));
  return adminFetch<ContactMessageList>(`/v1/admin/contact-messages?${query}`);
}
