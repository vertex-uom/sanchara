import Link from "next/link";
import { Crown, Info } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { Button } from "@/components/ui/button";
import { ToneChip, type ChipTone } from "@/components/ui/tone-chip";
import { FlatCard } from "@/components/ui/widget";
import { subscriptionHref } from "../subscription-params";
import { statusLabel } from "../subscription-rules";
import type { SubscriptionDetails, SubscriptionStatus } from "../types";
import { moneyText } from "./plan-text";

const STATUS_TONES: Record<SubscriptionStatus, ChipTone> = {
  active: "success",
  trial: "info",
  "past-due": "danger",
  cancelled: "neutral",
};

type Row = { label: string; value: string };

export function CurrentPlanCard({ subscription }: { subscription: SubscriptionDetails }) {
  const { plan, status, renewsOn, trialEndsOn, billingCycle, scheduledPlan } = subscription;
  const cancelled = status === "cancelled";
  const rows: Row[] = [
    cancelled
      ? { label: "Access until", value: formatDateOnly(renewsOn) }
      : { label: "Renews on", value: formatDateOnly(renewsOn) },
    ...(trialEndsOn ? [{ label: "Trial ends on", value: formatDateOnly(trialEndsOn) }] : []),
    { label: "Billing cycle", value: billingCycle ?? "[Billing cycle TBD]" },
    { label: "Price", value: moneyText(plan.price, "Price") },
  ];

  return (
    <FlatCard aria-labelledby="current-plan-title" className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Crown aria-hidden="true" className="size-8 shrink-0 text-office-icon" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-office-muted">Current plan</p>
          <h2 id="current-plan-title" className="text-xl font-semibold">
            {plan.name}
          </h2>
        </div>
        <ToneChip tone={STATUS_TONES[status]} dot>
          {statusLabel(status)}
        </ToneChip>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-[9rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-office-muted">{row.label}</dt>
            <dd className="font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>

      {scheduledPlan ? (
        <p className="flex gap-2 rounded-lg bg-office-tint-blue p-3 text-sm text-office-label">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-ink-blue" />
          Changes to {scheduledPlan.name} on {formatDateOnly(scheduledPlan.effectiveOn)}.
        </p>
      ) : null}

      {cancelled ? null : (
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button asChild variant="office" className="h-11 rounded-lg px-4 text-base md:h-10">
            <Link href={subscriptionHref({ panel: "change-plan" })} scroll={false}>
              Change plan
            </Link>
          </Button>
          <Link
            href={subscriptionHref({ panel: "cancel" })}
            scroll={false}
            className="focus-ring inline-flex min-h-11 items-center rounded-md text-sm font-medium text-office-danger hover:underline"
          >
            Cancel subscription
          </Link>
        </div>
      )}
    </FlatCard>
  );
}
