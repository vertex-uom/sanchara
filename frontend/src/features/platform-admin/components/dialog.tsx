"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { ADMIN_ICON_BUTTON, ICON_STROKE } from "../sidebar-modes";

// Modal dialog for Platform Admin confirmations and viewers. Radix handles
// focus trapping, Escape and returning focus to the trigger. Pass `open` and
// `onOpenChange` to close it from code, e.g. after a successful save.
export function AdminDialog({
  trigger,
  title,
  description,
  size = "md",
  children,
  footer,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  size?: "md" | "lg";
  children?: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-admin-heading/40" />
        <Dialog.Content
          // Radix warns when a dialog has no Description; opt out explicitly.
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-[14px] border border-admin-border bg-admin-card p-5 text-admin-heading shadow-xl",
            size === "lg" ? "max-w-[760px]" : "max-w-[480px]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-admin-heading">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-[12.5px] text-admin-muted-text">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close aria-label="Close" className={cn(ADMIN_ICON_BUTTON, "-mt-2 -mr-2")}>
              <X aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5" />
            </Dialog.Close>
          </div>
          {children}
          {footer ? <div className="flex flex-wrap justify-end gap-2 pt-1">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const AdminDialogClose = Dialog.Close;
