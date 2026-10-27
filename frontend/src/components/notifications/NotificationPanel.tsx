"use client";

import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { BellOff, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";
import type { NotificationProps } from "./types";

type Filter = "all" | "unread";

type NotificationPanelProps = Omit<NotificationProps, "onOpenChange"> & {
  /** id of the heading, for the surrounding dialog's aria-labelledby. */
  headingId: string;
  /** Shows a close button in the header when provided. */
  onClose?: () => void;
};

const SKELETON_ROWS = 3;

// Panel body: header, All | Unread tabs and the list (or its empty, loading or error state).
export function NotificationPanel({
  notifications,
  unreadCount,
  labels,
  isLoading = false,
  error = null,
  headingId,
  onClose,
  onItemClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onRetry,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const hasCountdown = notifications.some((item) => item.expiresAt);
  const now = useNow(hasCountdown ? 1000 : 60_000);

  const visible = filter === "unread" ? notifications.filter((item) => !item.read) : notifications;

  return (
    <div className="flex max-h-[min(70dvh,560px)] flex-col">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <h2 id={headingId} className="text-base font-semibold">
          {labels.title}
        </h2>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0 || !onMarkAllAsRead}
          className="ml-auto inline-flex min-h-8 items-center rounded-lg px-2 text-sm font-medium text-(--ntf-accent) transition-colors hover:bg-(--ntf-hover) focus-ring disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent motion-reduce:transition-none"
        >
          {labels.markAllAsRead}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="inline-flex size-8 items-center justify-center rounded-lg text-(--ntf-icon) transition-colors hover:bg-(--ntf-hover) focus-ring motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <Tabs.Root value={filter} onValueChange={(value) => setFilter(value === "unread" ? "unread" : "all")} className="flex min-h-0 flex-1 flex-col">
        <Tabs.List aria-label={labels.tabsLabel} className="flex gap-5 border-b border-border px-4">
          <PanelTab value="all">{labels.tabAll}</PanelTab>
          <PanelTab value="unread">
            {labels.tabUnread}
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-(--ntf-muted-bg) px-1.5 text-xs leading-5 tabular-nums">{unreadCount}</span>
            )}
          </PanelTab>
        </Tabs.List>

        {/* One content region serves both tabs; the filter only changes which rows it lists. */}
        <Tabs.Content value={filter} className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-(--ntf-accent) focus-visible:ring-inset">
          {isLoading ? (
            <LoadingState label={labels.loading} />
          ) : error ? (
            <ErrorState message={error} retryLabel={labels.retry} onRetry={onRetry} />
          ) : visible.length === 0 ? (
            <EmptyState message={filter === "unread" ? labels.emptyUnread : labels.empty} />
          ) : (
            <ul>
              {visible.map((item) => (
                <NotificationItem key={item.id} item={item} labels={labels} now={now} onItemClick={onItemClick} onMarkAsRead={onMarkAsRead} />
              ))}
            </ul>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function PanelTab({ value, children }: { value: Filter; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "-mb-px inline-flex min-h-10 items-center border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors outline-none motion-reduce:transition-none",
        "hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-(--ntf-accent)",
        "data-[state=active]:border-(--ntf-accent) data-[state=active]:text-foreground",
      )}
    >
      {children}
    </Tabs.Trigger>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <ul aria-hidden="true">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <li key={index} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <span className="size-9 shrink-0 animate-pulse rounded-full bg-(--ntf-muted-bg) motion-reduce:animate-none" />
            <span className="flex-1 space-y-2 pt-1">
              <span className="block h-3 w-2/3 animate-pulse rounded bg-(--ntf-muted-bg) motion-reduce:animate-none" />
              <span className="block h-3 w-full animate-pulse rounded bg-(--ntf-muted-bg) motion-reduce:animate-none" />
              <span className="block h-2.5 w-1/4 animate-pulse rounded bg-(--ntf-muted-bg) motion-reduce:animate-none" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--ntf-muted-bg)">
        <BellOff aria-hidden="true" className="size-6 text-(--ntf-icon)" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ErrorState({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--ntf-critical-bg)">
        <CircleAlert aria-hidden="true" className="size-6 text-(--ntf-critical-ink)" />
      </span>
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-(--ntf-hover) focus-ring motion-reduce:transition-none"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// Current time, re-read every intervalMs while the panel is mounted (i.e. open).
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
