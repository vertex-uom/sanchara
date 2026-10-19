import { Crown } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { formatCount } from "@/lib/format/numbers";
import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { RadioCards } from "@/components/ui/radio-cards";
import { UrlDialog } from "@/components/ui/url-dialog";
import { changePlanAction } from "../actions";
import { subscriptionHref } from "../subscription-params";
import { blockingUsage } from "../subscription-rules";
import type { PlanOption, SubscriptionDetails } from "../types";
import { limitText, moneyText } from "./plan-text";

function PlanDescription({ plan, over }: { plan: PlanOption; over: SubscriptionDetails["usage"] }) {
  return (
    <>
      <span className="block">{moneyText(plan.price, "Price")}</span>
      <span className="block">
        Properties {limitText(plan.limits.properties)} · Units {limitText(plan.limits.units)} · Staff {limitText(plan.limits.staff)}
      </span>
      {over.map((item) => (
        <span key={item.key} className="mt-1 block font-medium text-office-danger-text">
          Not available: you use {formatCount(item.used)} {item.label.toLowerCase()}; this plan allows {limitText(plan.limits[item.key])}.
        </span>
      ))}
    </>
  );
}

// Plans that can't hold today's usage are shown but can't be chosen (limits block in v8).
export function ChangePlanPanel({ subscription }: { subscription: SubscriptionDetails }) {
  const { plans, plan, scheduledPlan, usage, renewsOn } = subscription;
  const closeHref = subscriptionHref();
  return (
    <UrlDialog title="Change plan" closeHref={closeHref} variant="panel">
      <form action={changePlanAction} className="flex flex-col gap-5">
        <RadioCards
          name="planId"
          legend="Choose a plan"
          defaultValue={scheduledPlan?.id ?? plan.id}
          options={plans.map((option) => {
            const over = blockingUsage(usage, option);
            return {
              value: option.id,
              label: option.id === plan.id ? `${option.name} (current)` : option.name,
              description: <PlanDescription plan={option} over={over} />,
              icon: Crown,
              disabled: over.length > 0,
            };
          })}
        />
        <p className="text-sm text-office-muted">
          The change takes effect on {formatDateOnly(renewsOn)}, your next renewal. No payment details are needed here.
        </p>
        <DialogActions closeHref={closeHref}>
          <Button type="submit" variant="office" className={dialogButtonClass}>
            Change plan
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
