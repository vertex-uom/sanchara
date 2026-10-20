"use client";

import { startGoogleSignIn } from "../actions";
import { SubmitButton } from "./form-controls";

// Starts the server-side Google flow; returns to `returnTo` afterwards.
export function GoogleButton({ label, returnTo }: { label: string; returnTo: string | null }) {
  return (
    <form action={startGoogleSignIn}>
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <SubmitButton
        variant="light"
        pendingLabel="Opening Google…"
        icon={
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-cyan shadow-sm">
            G
          </span>
        }
      >
        {label}
      </SubmitButton>
    </form>
  );
}
