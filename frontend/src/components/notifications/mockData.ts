import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import type { NotificationItemData, NotificationLabels } from "./types";

const MINUTE_MS = 60 * 1000;

// Back Office copy. Other dashboards pass their own labels.
export const backofficeNotificationLabels: NotificationLabels = {
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

// Back Office events from the spec, timed relative to `now` so the hold countdown is live.
export function createBackofficeMockNotifications(propertyId: string, now: number = Date.now()): NotificationItemData[] {
  const ago = (minutes: number) => new Date(now - minutes * MINUTE_MS).toISOString();
  const p = (subPath: string) => propertyPath(propertyId, subPath);

  return [
    {
      id: "ntf-hold-1",
      type: "hold",
      severity: "warning",
      dashboard: "backoffice",
      title: "Enquiry hold expiring",
      message: "Room 3, 12-15 Nov, expires soon",
      createdAt: ago(2),
      read: false,
      actionLabel: "View enquiry",
      href: p("enquiries"),
      expiresAt: new Date(now + 14 * MINUTE_MS + 30 * 1000).toISOString(),
    },
    {
      id: "ntf-booking-1",
      type: "booking",
      severity: "success",
      dashboard: "backoffice",
      title: "New online booking",
      message: "Room 5, 3 nights, paid in full",
      createdAt: ago(5),
      read: false,
      actionLabel: "View reservation",
      href: p("reservations"),
    },
    {
      id: "ntf-subscription-1",
      type: "subscription",
      severity: "critical",
      dashboard: "backoffice",
      title: "Subscription payment failed",
      message: "Please pay within 3 business days to avoid suspension",
      createdAt: ago(42),
      read: false,
      actionLabel: "Update payment",
      href: COMPANY_PATHS.subscription,
    },
    {
      id: "ntf-payment-1",
      type: "payment",
      severity: "info",
      dashboard: "backoffice",
      title: "Payment recorded",
      message: "Cash, Room 2",
      createdAt: ago(75),
      read: true,
      actionLabel: "View payment",
      href: p("payments"),
    },
    {
      id: "ntf-system-1",
      type: "system",
      severity: "warning",
      dashboard: "backoffice",
      title: "WhatsApp limit reached",
      message: "Messages now go by email only until next month",
      createdAt: ago(3 * 60),
      read: true,
    },
    {
      id: "ntf-no-show-1",
      type: "no_show",
      severity: "info",
      dashboard: "backoffice",
      title: "Marked as no-show",
      message: "Room 4 was not checked in by the cut-off time",
      createdAt: ago(20 * 60),
      read: true,
      actionLabel: "View reservation",
      href: p("reservations"),
    },
    {
      id: "ntf-review-1",
      type: "review",
      severity: "success",
      dashboard: "backoffice",
      title: "New review received",
      message: "5 stars from a verified stay",
      createdAt: ago(2 * 24 * 60),
      read: true,
      actionLabel: "Read review",
      href: p("reviews"),
    },
  ];
}
