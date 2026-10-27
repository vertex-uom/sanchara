import { Suspense } from "react";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { PageHeader } from "@/components/ui/page-header";
import {
  BillingHistory,
  CancelDialog,
  ChangePlanPanel,
  CurrentPlanCard,
  getSubscription,
  parseSubscriptionParams,
  PlanFeatures,
  ReactivateDialog,
  SUBSCRIPTION_ERROR_MESSAGES,
  SubscriptionSkeleton,
  UsageCard,
} from "@/features/subscription";

export const metadata = { title: "Subscription & Plan" };

type SubscriptionProps = Pick<PageProps<"/backoffice/company/subscription">, "searchParams">;

// Owner only, even when a Manager exists. No payment details are entered here;
// plan values still open in v8 come from lib/plan/placeholders.ts.
export default function Page({ searchParams }: PageProps<"/backoffice/company/subscription">) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-col gap-6 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6 xl:flex-row xl:items-start"
    >
      <Suspense fallback={<SubscriptionSkeleton />}>
        <Subscription searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Subscription({ searchParams }: SubscriptionProps) {
  const [query, user] = await Promise.all([searchParams, getCurrentStaff()]);
  if (!can(user, "subscription.read")) redirect("/forbidden");

  const { panel, error } = parseSubscriptionParams(query);
  const subscription = await getSubscription();
  const changeable = subscription.status !== "cancelled";

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <PageHeader
          title="Subscription & Plan"
          description="Your plan, what it includes, usage against its limits and billing history."
        />
        {error ? (
          <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger">
            {SUBSCRIPTION_ERROR_MESSAGES[error]}
          </p>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          <CurrentPlanCard subscription={subscription} />
          <UsageCard usage={subscription.usage} />
        </div>
        <PlanFeatures features={subscription.plan.features} />
        <BillingHistory invoices={subscription.invoices} />
      </div>

      {panel === "change-plan" && changeable ? <ChangePlanPanel subscription={subscription} /> : null}
      {panel === "cancel" && changeable ? (
        <CancelDialog planName={subscription.plan.name} renewsOn={subscription.renewsOn} />
      ) : null}
      {panel === "reactivate" && !changeable ? (
        <ReactivateDialog planName={subscription.plan.name} renewsOn={subscription.renewsOn} />
      ) : null}
    </>
  );
}
