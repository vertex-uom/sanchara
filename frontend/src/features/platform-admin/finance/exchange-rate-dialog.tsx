"use client";

import { useId } from "react";
import { Coins } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminInput, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import { formatRate } from "./status";

// Sets a new platform rate. Placeholder until the platform-admin API exists;
// who owns the rate and how often it changes is still open in the docs.
// TODO(finance): submit through a Server Action and record it in the audit log.
export function UpdateRateDialog({ current }: { current: number }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={Coins} variant="primary">
          Update rate
        </AdminButton>
      }
      title="Update the platform exchange rate"
      description={`Currently LKR ${formatRate(current)} per USD. The new rate applies to new quotes only; every reservation keeps the rate it was booked at.`}
      footer={
        <>
          <AdminDialogClose asChild>
            <AdminButton>Cancel</AdminButton>
          </AdminDialogClose>
          <AdminButton icon={Coins} variant="primary" placeholder>
            Set rate
          </AdminButton>
        </>
      }
    >
      <AdminField label="LKR per 1 USD" htmlFor={`${id}-rate`}>
        <AdminInput id={`${id}-rate`} type="number" inputMode="decimal" step="0.01" min="1" required defaultValue={formatRate(current)} autoComplete="off" className="tabular-nums" />
      </AdminField>
      <AdminField label="Note (recorded in the audit log)" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="e.g. CBSL indicative rate, 20 Oct" />
      </AdminField>
      <p className="text-[11px] text-admin-muted-text">Connects to the API in a later step.</p>
    </AdminDialog>
  );
}
