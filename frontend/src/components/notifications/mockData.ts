import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import type { NotificationItemData, NotificationLabels, NotificationVariant } from "./types";

const MINUTE_MS = 60 * 1000;

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

type MockOptions = {
  /** Back Office only: the current property, for property-scoped links. */
  propertyId?: string;
  now?: number;
};

// Mock notifications for a dashboard. Remove once the notifications API exists.
export function createMockNotifications(variant: NotificationVariant, { propertyId = "", now = Date.now() }: MockOptions = {}) {
  if (variant === "admin") return createAdminMockNotifications(now);
  if (variant === "traveller") return createTravellerMockNotifications(now);
  return createBackofficeMockNotifications(propertyId, now);
}

const minutesAgo = (now: number, minutes: number) => new Date(now - minutes * MINUTE_MS).toISOString();

// Back Office events from the spec, timed relative to `now` so the hold countdown is live.
function createBackofficeMockNotifications(propertyId: string, now: number): NotificationItemData[] {
  const ago = (minutes: number) => minutesAgo(now, minutes);
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
