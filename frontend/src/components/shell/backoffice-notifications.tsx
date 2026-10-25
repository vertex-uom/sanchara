"use client";

import { useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { backofficeNotificationLabels, createBackofficeMockNotifications } from "@/components/notifications/mockData";

// Back Office bell on mock data. Swap the useState for the notifications API when it exists.
export function BackofficeNotifications({ propertyId }: { propertyId: string }) {
  const [notifications, setNotifications] = useState(() => createBackofficeMockNotifications(propertyId));
  const unreadCount = notifications.filter((item) => !item.read).length;

  function markAsRead(id: string) {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  function markAllAsRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  return (
    <NotificationBell
      variant="backoffice"
      notifications={notifications}
      unreadCount={unreadCount}
      labels={backofficeNotificationLabels}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    />
  );
}
