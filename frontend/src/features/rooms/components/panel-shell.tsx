"use client";

import { createContext, useContext, useEffect, type KeyboardEvent, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { FOCUS_SCOPE } from "@/components/ui/focus-scope";

// From this width panels dock beside the rooms; below it they're a drawer
// (tablet) or a full-screen sheet (phone).
const DESKTOP_QUERY = "(min-width: 80rem)";

export const FIELD = "focus-ring h-11 w-full rounded-lg border bg-card px-3 text-sm text-foreground md:h-10";
export const LABEL = "mb-1.5 block text-sm font-medium text-office-label";
const HELP = "mt-1.5 text-xs text-office-muted";
const ERROR = "mt-1.5 text-xs font-medium text-office-danger-text";

// Whether the open panel is docked (true) or a modal drawer / sheet (false).
const DockedContext = createContext(true);

type PanelShellProps = {
  titleId: string;
  // Changes when the panel shows something else; docked panels move focus to the title then.
  focusKey: string;
  onRequestClose: () => void;
  children: ReactNode;
};

function focusTitle(titleId: string) {
  document.getElementById(titleId)?.focus();
}

// The right-hand panel frame shared by the unit and room type panels:
// docked card on desktop (Escape closes), modal drawer / sheet below that
// (focus trapped, Escape and the overlay close).
export function PanelShell({ titleId, focusKey, onRequestClose, children }: PanelShellProps) {
  const docked = useMediaQuery(DESKTOP_QUERY, true);

  useEffect(() => {
    if (docked) focusTitle(titleId);
  }, [docked, focusKey, titleId]);

  // `docked` is decided here once and shared, so the header never renders
  // the modal title outside the modal.
  const body = <DockedContext.Provider value={docked}>{children}</DockedContext.Provider>;

  if (docked) {
    return (
      <aside
        aria-labelledby={titleId}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "Escape") onRequestClose();
        }}
        className="flex flex-col overflow-hidden rounded-[16px] border border-border bg-card xl:sticky xl:top-22 xl:h-[calc(100dvh-7rem)]"
      >
        {body}
      </aside>
    );
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onRequestClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusTitle(titleId);
          }}
          className={cn(
            FOCUS_SCOPE,
            "fixed inset-0 z-50 flex flex-col bg-card shadow-xl",
            "md:left-auto md:w-[22rem] md:max-w-[90vw] md:border-l md:border-border",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-right motion-reduce:animate-none",
          )}
        >
          {body}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type PanelHeaderProps = {
  titleId: string;
  title: string;
  onClose: () => void;
  // Optional summary under the title (e.g. the unit being edited).
  children?: ReactNode;
};

export function PanelHeader({ titleId, title, onClose, children }: PanelHeaderProps) {
  const docked = useContext(DockedContext);
  const heading = (
    <h2 id={titleId} tabIndex={-1} className="text-lg font-bold text-foreground outline-none">
      {title}
    </h2>
  );
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        {docked ? heading : <Dialog.Title asChild>{heading}</Dialog.Title>}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          className="focus-ring inline-flex size-11 items-center justify-center rounded-md text-office-icon hover:bg-office-chip md:size-8"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  );
}

type PanelFooterProps = {
  formId: string;
  submitLabel: string;
  canSubmit: boolean;
  saving: boolean;
  onCancel: () => void;
};

// Pinned Cancel / submit row. Submit stays greyed until the form can be sent.
export function PanelFooter({ formId, submitLabel, canSubmit, saving, onCancel }: PanelFooterProps) {
  return (
    <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
      <Button type="button" variant="outline" onClick={onCancel} className="focus-ring focus-visible:ring-0 h-11 rounded-lg bg-card text-sm font-semibold">
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        disabled={!canSubmit}
        aria-busy={saving || undefined}
        className={cn(
          "focus-ring focus-visible:ring-0 h-11 gap-2 rounded-lg text-sm font-semibold",
          canSubmit || saving
            ? "bg-brand-tropical text-white hover:bg-brand-tropical/90"
            : "bg-office-chip text-office-muted disabled:opacity-100",
        )}
      >
        {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
        {saving ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  help?: string;
  error?: string;
  // Text shown at the right of the label row (e.g. a character counter).
  aside?: ReactNode;
  // Renders the control; receives the ids to put in aria-describedby.
  children: (describedBy: string | undefined) => ReactNode;
};

// Label, control, helper text and inline error, wired for screen readers.
export function Field({ id, label, help, error, aside, children }: FieldProps) {
  const ids = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {aside}
      </div>
      {children(ids || undefined)}
      {help ? (
        <p id={`${id}-help`} className={HELP}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={ERROR}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
