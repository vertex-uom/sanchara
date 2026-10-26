"use client";

import { useState } from "react";
import { CalendarX2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/widget";
import { formatDate } from "@/lib/format/dates";
import { BLOCK_REASON_LABELS, formatDateRange } from "../results";
import type { DateBlock } from "../types";

type DateBlocksListProps = {
  blocks: DateBlock[];
  loading: boolean;
  error?: string;
  // Rejects with an ApiError when the block can't be removed.
  onDelete: (blockId: string) => Promise<void>;
};

function errorMessage(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
    ? error.message
    : "The block couldn't be deleted. Try again.";
}

// Existing date blocks with a confirmed Delete. Only shown to people who can
// manage blocks.
export function DateBlocksList({ blocks, loading, error, onDelete }: DateBlocksListProps) {
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<DateBlock | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(pendingDelete.id);
      toast(`Block deleted for ${pendingDelete.unitName}`);
      setPendingDelete(null);
    } catch (failure) {
      setDeleteError(errorMessage(failure));
    } finally {
      setDeleting(false);
    }
  }

  let body;
  if (error) {
    body = (
      <p role="alert" className="text-sm font-medium text-office-danger-text">
        {error}
      </p>
    );
  } else if (loading && blocks.length === 0) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-2">
        <span className="sr-only">Loading date blocks</span>
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    );
  } else if (blocks.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-office-chip px-4 py-10 text-center">
        <CalendarX2 aria-hidden="true" className="size-6 text-office-icon" strokeWidth={1.5} />
        <p className="text-sm font-medium text-foreground">No date blocks yet</p>
      </div>
    );
  } else {
    body = (
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs text-office-muted">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-medium">Unit</th>
              <th scope="col" className="py-2 pr-4 font-medium">Dates</th>
              <th scope="col" className="py-2 pr-4 font-medium">Reason</th>
              <th scope="col" className="py-2 pr-4 font-medium">Created by</th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 font-semibold text-foreground">{block.unitName}</td>
                <td className="py-3 pr-4 whitespace-nowrap text-foreground">{formatDateRange(block.startDate, block.endDate)}</td>
                <td className="py-3 pr-4 text-foreground">
                  {BLOCK_REASON_LABELS[block.reason]}
                  {block.note ? <span className="block text-xs text-office-muted">{block.note}</span> : null}
                </td>
                <td className="py-3 pr-4 text-foreground">
                  {block.createdByName}
                  <span className="block text-xs text-office-muted">{formatDate(new Date(block.createdAt))}</span>
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setPendingDelete(block);
                    }}
                    className="focus-ring inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-office-danger-text hover:bg-office-danger-soft md:h-8"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Delete
                    <span className="sr-only">
                      {" "}
                      block for {block.unitName}, {formatDateRange(block.startDate, block.endDate)}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section aria-labelledby="date-blocks-title" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 id="date-blocks-title" className="text-lg font-bold text-foreground">
        Date blocks
      </h2>
      <p className="mt-1 mb-4 text-sm text-office-muted">Blocked units can&apos;t be booked on these dates.</p>
      {body}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this block?"
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        pending={deleting}
        error={deleteError}
      >
        {pendingDelete ? (
          <p>
            <span className="font-semibold text-foreground">{pendingDelete.unitName}</span> will be bookable again for{" "}
            {formatDateRange(pendingDelete.startDate, pendingDelete.endDate)}.
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
