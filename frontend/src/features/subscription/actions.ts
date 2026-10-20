"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApiError } from "@/lib/api-client/errors";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { cancelSubscription, changePlan } from "./server/subscription";
import { SUBSCRIPTION_ERROR_MESSAGES, subscriptionHref, type SubscriptionErrorCode } from "./subscription-params";

// Owner only: every action re-checks; the UI only hides what a user can't do.

// App route behind the proxy rewrite. The layout holds the sidebar plan card.
const SUBSCRIPTION_ROUTE = "/backoffice/company/subscription";

export async function changePlanAction(formData: FormData) {
  const planId = formData.get("planId");
  if (!(await isOwner())) finish("FORBIDDEN");
  finish(errorCode(await changePlan(typeof planId === "string" ? planId : "")));
}

export async function cancelAction() {
  if (!(await isOwner())) finish("FORBIDDEN");
  finish(errorCode(await cancelSubscription()));
}

async function isOwner() {
  return can(await getCurrentStaff(), "subscription.read");
}

function errorCode(error: ApiError | null): SubscriptionErrorCode | null {
  if (!error) return null;
  return Object.hasOwn(SUBSCRIPTION_ERROR_MESSAGES, error.code) ? (error.code as SubscriptionErrorCode) : "FAILED";
}

// Back to the page with the panel closed; a refusal shows its message there.
function finish(refusal: SubscriptionErrorCode | null): never {
  if (!refusal) revalidatePath(SUBSCRIPTION_ROUTE, "layout");
  redirect(subscriptionHref(refusal ? { error: refusal } : {}));
}
