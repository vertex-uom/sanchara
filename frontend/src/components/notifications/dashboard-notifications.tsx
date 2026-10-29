"use client";

import { useState } from "react";
import { NotificationBell } from "./notification-bell";
import { notificationLabels } from "./labels";
import { createMockNotifications } from "./mock-data";
import type { NotificationVariant } from "./types";

// The Back Office bell is live (features/notifications); these two still use mock data.
type DashboardNotificationsProps = {
  variant: Exclude<NotificationVariant, "backoffice">;
};

// Notification bell for the admin and traveller dashboards, on mock data. Swap
// the useState for their notifications API when it exists; the bell stays the same.
export function DashboardNotifications({ variant }: DashboardNotificationsProps) {
  const [notifications, setNotifications] = useState(() => createMockNotifications(variant));
  const unreadCount = notifications.filter((item) => !item.read).length;

  function markAsRead(id: string) {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  function markAllAsRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  return (
    <NotificationBell
      variant={variant}
      notifications={notifications}
      unreadCount={unreadCount}
      labels={notificationLabels}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    />
  );
}
