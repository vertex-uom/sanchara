"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Loader2, RotateCcw } from "lucide-react";
import { AdminButton } from "../components/ui";
import { markContactMessage } from "./actions";

// "Mark handled" on an open message, "Reopen" on a handled one.
export function MarkButton({ id, handled, from }: { id: string; handled: boolean; from: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <AdminButton
        icon={pending ? Loader2 : handled ? RotateCcw : CircleCheck}
        variant={handled ? "secondary" : "primary"}
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={() => startTransition(async () => setError(await markContactMessage(id, !handled)))}
        className={pending ? "h-8 px-2.5 text-xs [&>svg]:animate-spin" : "h-8 px-2.5 text-xs"}
      >
        {handled ? "Reopen" : "Mark handled"}
        <span className="sr-only"> — message from {from}</span>
      </AdminButton>
      {error ? (
        <p role="alert" className="text-[11px] text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
