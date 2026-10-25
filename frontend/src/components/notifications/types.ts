

export type NotificationType = "booking" | "payment" | "hold" | "no_show" | "review" | "subscription" | "company" | "website" | "system";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

/** The dashboard a notification belongs to. Components never branch on it. */
export type NotificationVariant = "backoffice" | "traveller" | "admin";

/** One notification as the API will return it. */
export interface NotificationItemData {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  /** Dashboard the notification was raised for (used for filtering upstream). */
  dashboard: NotificationVariant;
  title: string;
  message: string;
  /** ISO date-time; shown as relative time ("5 min ago"). */
  createdAt: string;
  read: boolean;
  /** Text of the optional action link, e.g. "View reservation". */
  actionLabel?: string;
  /** Where the action link goes. */
  href?: string;
  /** ISO date-time; shows a live countdown (mm:ss), then the expired label. */
  expiresAt?: string;
}

/** Every piece of visible or screen-reader text the components render. */
export interface NotificationLabels {
  /** Accessible name of the bell, e.g. "Notifications, 3 unread". */
  bell: (unreadCount: number) => string;
  /** Polite live-region text announced when the unread count changes. */
  unreadAnnouncement: (unreadCount: number) => string;
  /** Panel heading. */
  title: string;
  markAllAsRead: string;
  tabAll: string;
  tabUnread: string;
  /** Accessible name of the tab list. */
  tabsLabel: string;
  close: string;
  loading: string;
  empty: string;
  emptyUnread: string;
  retry: string;
  /** Screen-reader prefix for unread rows. */
  unread: string;
  /** Countdown prefix, e.g. "Expires in". */
  expiresIn: string;
  expired: string;
  /** Screen-reader name for each severity, e.g. { critical: "Critical" }. */
  severity: Record<NotificationSeverity, string>;
  /** BCP 47 locale used for relative times ("5 min ago"). */
  locale: string;
}

/** Props for the notification bell and its panel. */
export interface NotificationProps {
  /** Notifications to list, newest first. */
  notifications: NotificationItemData[];
  /** Unread total from the server (may exceed the loaded list). */
  unreadCount: number;
  /** All copy rendered by the components. */
  labels: NotificationLabels;
  /** Shows skeleton rows instead of the list. */
  isLoading?: boolean;
  /** Shows an error state with this message when set. */
  error?: string | null;
  /** Dashboard palette: sets data-notification-variant, which globals.css maps to --ntf-* tokens. No logic depends on it. */
  variant?: NotificationVariant;
  /** Called when a row or its action link is activated. */
  onItemClick?: (item: NotificationItemData) => void;
  /** Called with the id of an unread row when it is activated. */
  onMarkAsRead?: (id: string) => void;
  /** Called from the panel header button; disabled when unreadCount is 0. */
  onMarkAllAsRead?: () => void;
  /** Shows a retry button in the error state when provided. */
  onRetry?: () => void;
  /** Called when the panel opens or closes (e.g. to fetch on open). */
  onOpenChange?: (open: boolean) => void;
}
