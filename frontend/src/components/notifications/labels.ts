import type { NotificationLabels } from "./types";

// Shared copy for every dashboard. A dashboard can spread and override it.
export const notificationLabels: NotificationLabels = {
  bell: (count) => (count > 0 ? `Notifications, ${count} unread` : "Notifications"),
  unreadAnnouncement: (count) => (count > 0 ? `${count} unread notifications` : "No unread notifications"),
  title: "Notifications",
  markAllAsRead: "Mark all as read",
  tabAll: "All",
  tabUnread: "Unread",
  tabsLabel: "Filter notifications",
  close: "Close notifications",
  loading: "Loading notifications",
  empty: "You're all caught up. New notifications will appear here.",
  emptyUnread: "No unread notifications.",
  retry: "Try again",
  unread: "Unread",
  expiresIn: "Expires in",
  expired: "Expired",
  severity: { info: "Info", success: "Success", warning: "Warning", critical: "Critical" },
  locale: "en-GB",
};
