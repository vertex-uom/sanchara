import { Info, Receipt } from "lucide-react";
import { FlatCard } from "@/components/ui/widget";
import type { TaxLine } from "../types";

// Read-only: the platform sets tax formulas and rates; checkout adds them to
// the rates entered here.
export function TaxesCard({ taxes }: { taxes: TaxLine[] }) {
  return (
    <FlatCard aria-labelledby="taxes-title" className="flex flex-col gap-4">
      <div>
        <h2 id="taxes-title" className="text-lg font-semibold">
          Taxes
        </h2>
        <p className="mt-0.5 text-sm text-office-muted">Added to your rates at checkout. Guests see each line on their quote and invoice.</p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {taxes.map((tax) => (
          <li key={tax.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-office-tint-teal">
              <Receipt className="size-4.5 text-office-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{tax.name}</p>
              <p className="text-xs text-office-muted">{tax.description}</p>
            </div>
            <p className="text-sm font-semibold">{tax.rate ?? "[Rate TBD]"}</p>
          </li>
        ))}
      </ul>
      <p className="flex gap-2 rounded-lg bg-office-chip p-3 text-sm text-office-label">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
        Tax rates and the order they apply in are set by the platform, so they can&apos;t be edited here.
      </p>
    </FlatCard>
  );
}
