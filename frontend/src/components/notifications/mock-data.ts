import { MINUTE_MS } from "@/lib/format/dates";
import type { NotificationItemData, NotificationLabels, NotificationVariant } from "./types";

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

// Mock notifications for a dashboard. Remove once the notifications API exists.
export function createMockNotifications(variant: Exclude<NotificationVariant, "backoffice">, now = Date.now()) {
  return variant === "admin" ? createAdminMockNotifications(now) : createTravellerMockNotifications(now);
}

const minutesAgo = (now: number, minutes: number) => new Date(now - minutes * MINUTE_MS).toISOString();

// Platform Admin events: onboarding, billing and platform health.
function createAdminMockNotifications(now: number): NotificationItemData[] {
  const ago = (minutes: number) => minutesAgo(now, minutes);

  return [
    {
      id: "ntf-admin-subscription-1",
      type: "subscription",
      severity: "critical",
      dashboard: "admin",
      title: "Subscription payment failed",
      message: "Lagoon Villas, 2nd failed attempt",
      createdAt: ago(8),
      read: false,
      actionLabel: "Open finance",
      href: "/finance",
    },
    {
      id: "ntf-admin-company-1",
      type: "company",
      severity: "success",
      dashboard: "admin",
      title: "Company onboarded",
      message: "Owner accepted the invite for Hill Top Stays",
      createdAt: ago(35),
      read: false,
      actionLabel: "View onboarding",
      href: "/onboarding",
    },
    {
      id: "ntf-admin-website-1",
      type: "website",
      severity: "warning",
      dashboard: "admin",
      title: "Website domain not verified",
      message: "DNS records for coralbay.lk are still missing",
      createdAt: ago(2 * 60),
      read: true,
      actionLabel: "View accounts",
      href: "/accounts",
    },
    {
      id: "ntf-admin-system-1",
      type: "system",
      severity: "info",
      dashboard: "admin",
      title: "Scheduled maintenance",
      message: "Database upgrade on Sunday, 02:00-03:00",
      createdAt: ago(26 * 60),
      read: true,
      actionLabel: "View audit log",
      href: "/audit-logs",
    },
  ];
}

// Traveller events: their bookings, holds and reviews.
function createTravellerMockNotifications(now: number): NotificationItemData[] {
  const ago = (minutes: number) => minutesAgo(now, minutes);

  return [
    {
      id: "ntf-traveller-hold-1",
      type: "hold",
      severity: "warning",
      dashboard: "traveller",
      title: "Complete your booking",
      message: "Your room at Lagoon Villas is held for you",
      createdAt: ago(1),
      read: false,
      actionLabel: "View bookings",
      href: "/account/bookings",
      expiresAt: new Date(now + 9 * MINUTE_MS).toISOString(),
    },
    {
      id: "ntf-traveller-booking-1",
      type: "booking",
      severity: "success",
      dashboard: "traveller",
      title: "Booking confirmed",
      message: "Hill Top Stays, 12-15 Nov, 2 guests",
      createdAt: ago(3 * 60),
      read: false,
      actionLabel: "View booking",
      href: "/account/bookings",
    },
    {
      id: "ntf-traveller-review-1",
      type: "review",
      severity: "info",
      dashboard: "traveller",
      title: "How was your stay?",
      message: "Leave a review for Coral Bay Inn",
      createdAt: ago(3 * 24 * 60),
      read: true,
    },
  ];
}
