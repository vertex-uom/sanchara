"use client";

import { useState } from "react";
import { NotificationBell } from "./notification-bell";
import { createMockNotifications, notificationLabels } from "./mock-data";
import type { NotificationVariant } from "./types";

// The Back Office draws its own bell; these two dashboards use this one.
type DashboardNotificationsProps = {
  variant: Exclude<NotificationVariant, "backoffice">;
};

// Notification bell for any dashboard, on mock data. Swap the useState for the
// notifications API when it exists; the bell and panel stay the same.
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
