import { Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export function AuditHeader() {
  return (
    <PageHeader
      title="Audit Trail"
      description="Track all changes to rates, reservations, payments, refunds, blocks and staff accounts, with who made it and when."
      action={
        <p className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-office-label">
          <Info aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
          Records are kept for 1 year
        </p>
      }
    />
  );
}
