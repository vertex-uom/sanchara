"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dialogButtonClass } from "@/components/ui/dialog-actions";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // What will happen, shown under the title.
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  // Confirm shows a spinner and both buttons wait.
  pending?: boolean;
  // Shown above the buttons when the action failed.
  error?: string | null;
  // Extra classes for the dialog box (it renders in a portal).
  className?: string;
};

// Small modal asking to confirm a destructive action (opened from state, not
// the URL). Radix moves focus in, traps it and returns it on close.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
  pending = false,
  error,
  className,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40" />
        <Dialog.Content
          aria-describedby={children ? "confirm-dialog-description" : undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl",
            className,
          )}
        >
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          {children ? (
            <div id="confirm-dialog-description" className="mt-3 text-sm text-office-label">
              {children}
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 rounded-lg bg-office-danger-soft px-3 py-2 text-sm font-medium text-office-danger-text">
              {error}
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={pending} className={`${dialogButtonClass} bg-card`}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="office-danger"
              onClick={onConfirm}
              disabled={pending}
              aria-busy={pending || undefined}
              className={`${dialogButtonClass} gap-2`}
            >
              {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
