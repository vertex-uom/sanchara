"use client";

import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import { Popover } from "radix-ui";
import { Bell } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";
import type { NotificationProps } from "./types";

const MAX_BADGE_COUNT = 9;

// Bell with an unread badge that opens the notification panel. The popover is
// modal: focus is trapped inside, and Escape or an outside click closes it.
export function NotificationBell({ variant = "backoffice", onOpenChange, ...panelProps }: NotificationProps) {
  const { unreadCount, labels } = panelProps;
  const headingId = useId();
  const pathname = usePathname();
  // Remember where the panel was opened, so a route change closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  if (openedAt !== null && openedAt !== pathname) setOpenedAt(null);
  const open = openedAt === pathname;

  function setOpen(next: boolean) {
    setOpenedAt(next ? pathname : null);
    onOpenChange?.(next);
  }

  return (
    <div data-notification-variant={variant} className="relative">
      <Popover.Root open={open} onOpenChange={setOpen} modal>
        <Popover.Trigger
          aria-label={labels.bell(unreadCount)}
          className="ntf-glass-trigger relative inline-flex size-11 items-center justify-center rounded-full text-(--ntf-icon) transition-[background-color,transform] duration-200 ease-out hover:bg-(--ntf-hover)/80 active:scale-95 focus-ring data-[state=open]:bg-(--ntf-hover)/80 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Bell aria-hidden="true" className="size-6" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-(--ntf-badge) px-1 text-[11px] leading-none font-semibold text-(--ntf-badge-text) tabular-nums shadow-[0_2px_6px_-1px_rgb(0_0_0/0.25)] ring-2 ring-white"
            >
              {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
            </span>
          )}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={8}
            aria-labelledby={headingId}
            data-notification-variant={variant}
            className="ntf-glass-panel z-50 w-[min(380px,calc(100vw-1rem))] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-2xl text-popover-foreground outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none"
          >
            <NotificationPanel {...panelProps} headingId={headingId} onClose={() => setOpen(false)} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <span aria-live="polite" className="sr-only">
        {labels.unreadAnnouncement(unreadCount)}
      </span>
    </div>
  );
}
