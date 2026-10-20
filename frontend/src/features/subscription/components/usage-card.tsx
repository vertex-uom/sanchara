import { TriangleAlert } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { UsageMeter } from "@/components/ui/usage-meter";
import { FlatCard } from "@/components/ui/widget";
import { isAtLimit } from "../subscription-rules";
import type { Usage } from "../types";
import { limitText } from "./plan-text";

// Each row says "used of limit" in text; the meter only repeats it.
export function UsageCard({ usage }: { usage: Usage[] }) {
  return (
    <FlatCard aria-labelledby="usage-title" className="h-full">
      <h2 id="usage-title" className="mb-4 text-lg font-semibold">
        Usage
      </h2>
      <ul className="space-y-5">
        {usage.map((item) => {
          const labelId = `usage-${item.key}`;
          return (
            <li key={item.key}>
              <p id={labelId} className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                <span className="text-office-label">{item.label}</span>
                <span className="font-semibold">
                  {formatCount(item.used)} of {limitText(item.limit)}
                </span>
              </p>
              {item.limit === null ? null : (
                <UsageMeter labelledBy={labelId} used={item.used} limit={item.limit} className="mt-2 h-2.5 w-full" />
              )}
              {isAtLimit(item) ? (
                <p className="mt-2 flex gap-2 text-sm font-medium text-office-danger-text">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Limit reached. You can&apos;t add more {item.label.toLowerCase()} on this plan.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </FlatCard>
  );
}
