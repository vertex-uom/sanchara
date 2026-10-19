import { Check, X } from "lucide-react";
import { ToneChip } from "@/components/ui/tone-chip";
import { FlatCard } from "@/components/ui/widget";
import type { PlanOption } from "../types";

// Included or not is said in words, with an icon; colour only reinforces it.
export function PlanFeatures({ features }: { features: PlanOption["features"] }) {
  return (
    <FlatCard aria-labelledby="plan-features-title">
      <h2 id="plan-features-title" className="mb-4 text-lg font-semibold">
        What your plan includes
      </h2>
      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.key} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm">{feature.label}</span>
            {feature.included ? (
              <ToneChip tone="success" icon={Check}>
                Included
              </ToneChip>
            ) : (
              <ToneChip tone="neutral" icon={X}>
                Not included
              </ToneChip>
            )}
          </li>
        ))}
      </ul>
    </FlatCard>
  );
}
