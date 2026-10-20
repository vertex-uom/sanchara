import { formatCount, usageRatio } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";

type UsageMeterProps = {
  // Id of the visible text that names the meter.
  labelledBy: string;
  used: number;
  limit: number;
  // "bright": Reports/Staff look; "gradient": the Overview WhatsApp meter.
  tone?: "bright" | "gradient";
  // Height and width come from the caller (e.g. "h-2 w-48").
  className?: string;
};

// "used of limit" bar. Screen readers get the numbers as aria values and text;
// callers also show them as visible text, so the bar is never the only signal.
export function UsageMeter({ labelledBy, used, limit, tone = "bright", className }: UsageMeterProps) {
  return (
    <div
      role="meter"
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={Math.min(used, limit)}
      aria-valuetext={`${formatCount(used)} of ${formatCount(limit)}`}
      className={cn("overflow-hidden rounded-full bg-office-meter-track", className)}
    >
      <div
        className={cn(
          "h-full rounded-full",
          tone === "gradient" ? "bg-linear-to-r from-office-meter-from to-office-meter-to" : "bg-office-chart-bright",
        )}
        style={{ width: `${usageRatio(used, limit) * 100}%` }}
      />
    </div>
  );
}
