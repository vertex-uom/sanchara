import { ChipLink } from "@/components/ui/chip-link";
import { RESIDENCIES, RESIDENCY_META } from "../config";
import type { RatePlan, Residency } from "../types";

type RatesToolbarProps = {
  residency: Residency;
  planId: string;
  plans: RatePlan[];
  hrefFor: (change: { residency?: Residency; planId?: string }) => string;
};

// Which grid is shown: residency on the left, rate plan on the right.
// Links, so switching drops unsaved edits; the grid warns about those.
export function RatesToolbar({ residency, planId, plans, hrefFor }: RatesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ul aria-label="Guest residency" className="flex flex-wrap gap-2">
        {RESIDENCIES.map((value) => (
          <li key={value}>
            <ChipLink size="sm" href={hrefFor({ residency: value })} active={value === residency}>
              {RESIDENCY_META[value].label}
            </ChipLink>
          </li>
        ))}
      </ul>
      <ul aria-label="Rate plan" className="flex flex-wrap gap-2">
        {plans.map((plan) => (
          <li key={plan.id}>
            <ChipLink size="sm" href={hrefFor({ planId: plan.id })} active={plan.id === planId} title={plan.description || undefined}>
              {plan.name}
            </ChipLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
