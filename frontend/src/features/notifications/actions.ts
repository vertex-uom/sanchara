"use server";

import type { NotificationItemData } from "@/components/notifications/types";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { readStaffToken } from "@/lib/auth/staff-session";

// The signed-in staff member's system notifications, through the API
// (docs/notifications-api-contract.md). The browser never holds the token.

// GET /v1/notifications.
type FeedResponse = { items: (NotificationItemData & { dismissible: boolean })[]; unreadCount: number };

export type FeedResult = { ok: true; notifications: NotificationItemData[]; unreadCount: number } | { ok: false; message: string };
export type ChangeResult = { ok: boolean };

const SIGNED_OUT = "Sign in to see your notifications.";

// The bell has no dismiss control yet, so `dismissible` is not passed on.
function toItem(item: FeedResponse["items"][number]): NotificationItemData {
  return {
    id: item.id,
    type: item.type,
    severity: item.severity,
    dashboard: item.dashboard,
    title: item.title,
    message: item.message,
    createdAt: item.createdAt,
    read: item.read,
    ...(item.actionLabel && item.href ? { actionLabel: item.actionLabel, href: item.href } : {}),
  };
}

export async function loadNotifications(): Promise<FeedResult> {
  const token = await readStaffToken();
  if (!token) return { ok: false, message: SIGNED_OUT };
  try {
    const feed = await apiFetch<FeedResponse>("/v1/notifications", { token });
    return { ok: true, notifications: feed.items.map(toItem), unreadCount: feed.unreadCount };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { ok: false, message: error.status === 401 ? SIGNED_OUT : "Notifications couldn't be loaded. Try again." };
  }
}

async function change(path: string): Promise<ChangeResult> {
  const token = await readStaffToken();
  if (!token) return { ok: false };
  try {
    await apiFetch(path, { method: "POST", token });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { ok: false };
  }
}

export async function markNotificationRead(id: string): Promise<ChangeResult> {
  return change(`/v1/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsRead(): Promise<ChangeResult> {
  return change("/v1/notifications/read-all");
}
