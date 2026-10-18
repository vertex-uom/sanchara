import { Crown } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { WidgetLink } from "@/components/ui/widget";
import { getSubscriptionSummary } from "../server/subscription";

// Plan summary in the Back Office sidebar footer.
export async function SidebarPlanCard() {
  const subscription = await getSubscriptionSummary();
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-lagoon/50 bg-card p-4 shadow-sm">
      <Crown aria-hidden="true" className="mt-0.5 size-7 shrink-0 text-brand-teal" />
      <div className="min-w-0">
        <p className="font-semibold">{subscription.planName}</p>
        <p className="text-sm text-muted-foreground">Renews on {formatDateOnly(subscription.renewsOn)}</p>
        <WidgetLink href={COMPANY_PATHS.subscription} srContext="subscription">
          Manage
        </WidgetLink>
      </div>
    </div>
  );
}
