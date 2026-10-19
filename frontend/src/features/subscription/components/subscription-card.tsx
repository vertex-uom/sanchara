import { Suspense } from "react";
import { Crown, MessageCircle } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { formatCount, formatPercent, usageRatio } from "@/lib/format/numbers";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { UsageMeter } from "@/components/ui/usage-meter";
import { Skeleton, WidgetCard, WidgetHeader, WidgetLink } from "@/components/ui/widget";
import { getSubscriptionSummary } from "../server/subscription";
import type { SubscriptionSummary } from "../types";

export function SubscriptionCard() {
  return (
    <WidgetCard aria-labelledby="subscription-title" className="h-full">
      <WidgetHeader
        id="subscription-title"
        title="Subscription & Plan"
        action={
          <WidgetLink href={COMPANY_PATHS.subscription} srContext="subscription">
            Manage
          </WidgetLink>
        }
      />
      <Suspense fallback={<Skeleton className="h-28 rounded-xl" />}>
        <SubscriptionDetails />
      </Suspense>
    </WidgetCard>
  );
}

async function SubscriptionDetails() {
  const subscription = await getSubscriptionSummary();
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 sm:border-r sm:border-border sm:pr-6">
        <Crown aria-hidden="true" className="size-8 shrink-0 text-office-icon" />
        <div>
          <p className="font-semibold">{subscription.planName}</p>
          <p className="text-sm text-office-accent">Renews on {formatDateOnly(subscription.renewsOn)}</p>
        </div>
      </div>
      <WhatsAppUsage usage={subscription.whatsapp} />
    </div>
  );
}

function WhatsAppUsage({ usage }: { usage: SubscriptionSummary["whatsapp"] }) {
  if (!usage) return <p className="text-sm text-muted-foreground">WhatsApp messages are not included in this plan.</p>;

  return (
    <div className="flex gap-3">
      <MessageCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-office-icon" />
      <div className="min-w-0 flex-1">
        <p id="whatsapp-usage-label" className="text-sm text-office-text">
          WhatsApp messages used
        </p>
        <p className="font-semibold">
          {formatCount(usage.used)} / {formatCount(usage.limit)}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <UsageMeter
            labelledBy="whatsapp-usage-label"
            used={usage.used}
            limit={usage.limit}
            tone="gradient"
            className="h-2.5 flex-1"
          />
          <span className="text-sm font-medium">{formatPercent(usageRatio(usage.used, usage.limit), 0)}</span>
        </div>
      </div>
    </div>
  );
}
