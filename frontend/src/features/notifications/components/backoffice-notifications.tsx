"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { notificationLabels } from "@/components/notifications/labels";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NotificationItemData } from "@/components/notifications/types";
import { loadNotifications, markAllNotificationsRead, markNotificationRead } from "../actions";

type Feed = { notifications: NotificationItemData[]; unreadCount: number };

// The Back Office bell on live data: loads on mount and whenever the panel
// opens; marking as read updates at once and reloads if the API refuses.
export function BackofficeNotifications() {
  const [feed, setFeed] = useState<Feed>({ notifications: [], unreadCount: 0 });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await loadNotifications();
      setLoaded(true);
      if (result.ok) {
        setFeed({ notifications: result.notifications, unreadCount: result.unreadCount });
        setError(null);
      } else {
        setError(result.message);
      }
    });
  }, []);

  useEffect(() => load(), [load]);

  function markAsRead(id: string) {
    setFeed((current) => ({
      notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
      unreadCount: Math.max(current.unreadCount - (current.notifications.some((item) => item.id === id && !item.read) ? 1 : 0), 0),
    }));
    startTransition(async () => {
      if (!(await markNotificationRead(id)).ok) load();
    });
  }

  function markAllAsRead() {
    setFeed((current) => ({ notifications: current.notifications.map((item) => ({ ...item, read: true })), unreadCount: 0 }));
    startTransition(async () => {
      if (!(await markAllNotificationsRead()).ok) load();
    });
  }

  return (
    <NotificationBell
      variant="backoffice"
      notifications={feed.notifications}
      unreadCount={feed.unreadCount}
      labels={notificationLabels}
      isLoading={!loaded}
      error={error}
      onRetry={load}
      onOpenChange={(open) => {
        if (open) load();
      }}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    />
  );
}
