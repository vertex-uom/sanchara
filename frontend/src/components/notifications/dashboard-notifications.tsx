"use client";

import { useState } from "react";
import { NotificationBell } from "./notification-bell";
import { createMockNotifications, notificationLabels } from "./mock-data";
import type { NotificationVariant } from "./types";

type DashboardNotificationsProps = {
  variant: NotificationVariant;
  /** Back Office only: the current property, for property-scoped links. */
  propertyId?: string;
};

// Notification bell for any dashboard, on mock data. Swap the useState for the
// notifications API when it exists; the bell and panel stay the same.
export function DashboardNotifications({ variant, propertyId }: DashboardNotificationsProps) {
  const [notifications, setNotifications] = useState(() => createMockNotifications(variant, { propertyId }));
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
