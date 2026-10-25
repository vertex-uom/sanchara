import Link from "next/link";
import {
  BedDouble,
  Building2,
  CalendarCheck,
  Globe,
  CircleAlert,
  Clock,
  CreditCard,
  type LucideIcon,
  OctagonAlert,
  Settings,
  Star,
  TriangleAlert,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItemData, NotificationLabels, NotificationSeverity, NotificationType } from "./types";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  booking: BedDouble,
  payment: CreditCard,
  hold: Clock,
  no_show: UserX,
  review: Star,
  subscription: CalendarCheck,
  company: Building2,
  website: Globe,
  system: Settings,
};

// Severity sets the icon tint; warning and critical also get a glyph so it is never colour alone.
const SEVERITY_STYLES: Record<NotificationSeverity, { tile: string; glyph?: LucideIcon }> = {
  info: { tile: "bg-(--ntf-info-bg) text-(--ntf-info-ink)" },
  success: { tile: "bg-(--ntf-success-bg) text-(--ntf-success-ink)" },
  warning: { tile: "bg-(--ntf-warning-bg) text-(--ntf-warning-ink)", glyph: TriangleAlert },
  critical: { tile: "bg-(--ntf-critical-bg) text-(--ntf-critical-ink)", glyph: OctagonAlert },
};

type NotificationItemProps = {
  item: NotificationItemData;
  labels: NotificationLabels;
  /** Current time in ms, ticked by the panel so countdowns stay in sync. */
  now: number;
  onItemClick?: (item: NotificationItemData) => void;
  onMarkAsRead?: (id: string) => void;
};

// One notification row. Clicking anywhere on it (or its action link) reports the click and marks it read.
export function NotificationItem({ item, labels, now, onItemClick, onMarkAsRead }: NotificationItemProps) {
  const TypeIcon = TYPE_ICONS[item.type];
  const severity = SEVERITY_STYLES[item.severity];
  const SeverityGlyph = severity.glyph;

  function activate() {
    onItemClick?.(item);
    if (!item.read) onMarkAsRead?.(item.id);
  }

  return (
    <li
      className={cn(
        "relative flex gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-(--ntf-hover) motion-reduce:transition-none",
        !item.read && "bg-(--ntf-hover)/60",
      )}
    >
      <span aria-hidden="true" className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-full", severity.tile)}>
        <TypeIcon className="size-4.5" />
        {SeverityGlyph && (
          <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-card">
            <SeverityGlyph className="size-3" strokeWidth={2.25} />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        {/* Stretched button: its ::after covers the whole row so the row is one click target. */}
        <button
          type="button"
          onClick={activate}
          className="w-full text-left outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-(--ntf-accent)"
        >
          <span className="sr-only">
            {!item.read && `${labels.unread}, `}
            {labels.severity[item.severity]}:{" "}
          </span>
          <span className={cn("block text-sm", item.read ? "font-normal" : "font-semibold")}>{item.title}</span>
          <span className="mt-0.5 block text-sm text-(--ntf-text)">{item.message}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <time dateTime={item.createdAt}>{formatRelative(item.createdAt, now, labels.locale)}</time>
            {item.expiresAt && <Countdown expiresAt={item.expiresAt} now={now} labels={labels} />}
          </span>
        </button>

        {item.actionLabel && item.href && (
          <Link
            href={item.href}
            onClick={activate}
            className="relative z-10 mt-1.5 inline-flex min-h-8 items-center rounded-lg px-2 -ml-2 text-sm font-medium text-(--ntf-accent) underline-offset-4 hover:underline focus-ring"
          >
            {item.actionLabel}
          </Link>
        )}
      </div>

      {!item.read && <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-(--ntf-accent)" />}
    </li>
  );
}

function Countdown({ expiresAt, now, labels }: { expiresAt: string; now: number; labels: NotificationLabels }) {
  const remaining = Date.parse(expiresAt) - now;
  if (Number.isNaN(remaining)) return null;

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-(--ntf-critical-ink)">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        {labels.expired}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-medium text-foreground">
      <Clock aria-hidden="true" className="size-3.5 text-(--ntf-warning-ink)" />
      {labels.expiresIn} <span className="tabular-nums">{formatCountdown(remaining)}</span>
    </span>
  );
}

// mm:ss, or h:mm:ss once an hour or more is left.
function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

// "5 min ago" in the given locale.
function formatRelative(iso: string, now: number, locale: string) {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size || unit === "second") return format.format(Math.round(seconds / size), unit);
  }
  return "";
}
