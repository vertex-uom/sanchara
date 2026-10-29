import "server-only";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";
import type { WebsiteRequestAssignee, WebsiteRequestDetail, WebsiteRequestFilters, WebsiteRequestRow, WebsiteRequestStatus } from "../types";

// Companies' requests for WEMIXT to build their website (sent from the Back
// Office), from the API.

export type WebsiteRequestList = {
  items: WebsiteRequestRow[];
  // Open requests in total, whatever the filters.
  total: number;
  counts: Record<WebsiteRequestStatus, number>;
  // Team members holding at least one open request, for the Assignee filter.
  assignees: WebsiteRequestAssignee[];
};

// Open requests, soonest due first.
export async function listWebsiteRequestRows(filters: WebsiteRequestFilters): Promise<WebsiteRequestList> {
  const query = new URLSearchParams();
  if (filters.status !== "all") query.set("status", filters.status);
  if (filters.assignee) query.set("assignee", filters.assignee);
  if (filters.q.trim()) query.set("q", filters.q.trim());
  const suffix = query.size ? `?${query}` : "";
  return adminFetch<WebsiteRequestList>(`/v1/admin/website-requests${suffix}`);
}

// How many requests are open (Accounts tab and KPI).
export async function countOpenWebsiteRequests(): Promise<{ total: number; dueSoon: number }> {
  const { items, total } = await listWebsiteRequestRows({ q: "", status: "all", assignee: "" });
  const soon = Date.now() + 2 * 24 * 60 * 60 * 1000;
  return { total, dueSoon: items.filter((item) => item.dueAt !== null && Date.parse(item.dueAt) < soon).length };
}

// Null when there's no such request (or the id isn't one).
export async function getWebsiteRequest(id: string): Promise<WebsiteRequestDetail | null> {
  try {
    const { request } = await adminFetch<{ request: WebsiteRequestDetail }>(`/v1/admin/website-requests/${encodeURIComponent(id)}`);
    return request;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
