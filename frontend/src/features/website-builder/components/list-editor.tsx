"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EditorPanelProps = {
  error: string | null;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
};

// Inline add/edit panel inside a step form. It is not a <form> (forms cannot
// nest), so callers validate in onSave and pass the message as error.
export function EditorPanel({
  error,
  saveLabel,
  onSave,
  onCancel,
  children,
}: EditorPanelProps) {
  return (
    <div className="rounded-xl border-[1.5px] border-brand-cyan bg-[#f8fcfd] p-4">
      {children}
      {error ? (
        <p
          role="alert"
          className="mt-3 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 border-office-meter-track bg-card px-4 font-semibold text-office-icon hover:bg-office-chip"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="office"
          onClick={onSave}
          className="h-10 px-4 font-semibold"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

// Edit and delete icon buttons at the end of a list row.
export function RowActions({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${name}`}
        className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-office-icon hover:bg-office-chip"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
        className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-office-icon hover:bg-office-danger-soft hover:text-office-danger-text"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </span>
  );
}
