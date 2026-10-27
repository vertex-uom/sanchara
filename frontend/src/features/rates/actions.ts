"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { RATES_ERROR_MESSAGES, RESIDENCIES, RESIDENCY_META, type RatesErrorCode } from "./config";
import { ratesHref } from "./rates-params";
import { createPlan, deleteSeason, getOtherSeasons, getPlanNames, getRates, saveSeason, updateRates } from "./server/rates";
import { validatePlan, validateRates, validateSeason, type PlanInput, type SeasonInput } from "./validation";

// App route behind the proxy rewrite.
const RATES_ROUTE = "/backoffice/p/[propertyId]/rates";
const ID = /^[a-z0-9_-]{1,64}$/;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function idField(formData: FormData, name: string) {
  const value = field(formData, name);
  return ID.test(value) ? value : null;
}

function withMessage(error: ApiError): ApiError {
  const code: RatesErrorCode = Object.hasOwn(RATES_ERROR_MESSAGES, error.code) ? (error.code as RatesErrorCode) : "FAILED";
  return { ...error, code, message: RATES_ERROR_MESSAGES[code] };
}

const failed = () => apiError(400, "FAILED", RATES_ERROR_MESSAGES.FAILED);
const forbidden = () => apiError(403, "FORBIDDEN", RATES_ERROR_MESSAGES.FORBIDDEN);

// Rates and seasons are Management (Owner and Manager): every action re-checks.
async function mayManage() {
  return can(await getCurrentStaff(), "rates.manage");
}
const invalid = (fieldErrors: Record<string, string>) =>
  apiError(422, "VALIDATION_FAILED", "Fix the highlighted fields, then save again.", fieldErrors);

// saved counts successful saves, so the form can announce each one.
export type RatesFormState = { error: ApiError | null; saved: number };

export async function saveRatesAction(previous: RatesFormState, formData: FormData): Promise<RatesFormState> {
  if (!(await mayManage())) return { ...previous, error: forbidden() };
  const propertyId = idField(formData, "propertyId");
  const planId = idField(formData, "planId");
  const residency = RESIDENCIES.find((value) => value === field(formData, "residency"));
  const version = Number(field(formData, "version"));
  if (!propertyId || !planId || !residency || !Number.isInteger(version)) return { ...previous, error: failed() };

  // Room types and columns come from the server, not the form.
  const view = await getRates(propertyId, planId, residency);
  const input = Object.fromEntries([...formData.entries()].filter(([key, value]) => key.startsWith("rate:") && typeof value === "string")) as Record<string, string>;
  const parsed = validateRates(
    input,
    view.roomTypes.map((roomType) => roomType.id),
    ["base", ...view.seasons.map((season) => season.id)],
    RESIDENCY_META[residency].currency,
  );
  if (!parsed.ok) return { ...previous, error: invalid(parsed.fieldErrors) };
  const error = await updateRates(propertyId, planId, residency, version, parsed.value);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(RATES_ROUTE, "page");
  return { error: null, saved: previous.saved + 1 };
}

export type DialogFormState<T> = { error: ApiError | null; values: T };

// Add and edit share one action; "seasonId" is empty when adding.
export async function saveSeasonAction(previous: DialogFormState<SeasonInput>, formData: FormData): Promise<DialogFormState<SeasonInput>> {
  const values = { name: field(formData, "name"), from: field(formData, "from"), to: field(formData, "to") };
  if (!(await mayManage())) return { error: forbidden(), values };
  const propertyId = idField(formData, "propertyId");
  if (!propertyId) return { error: failed(), values };
  const seasonId = idField(formData, "seasonId");

  const parsed = validateSeason(values, await getOtherSeasons(propertyId, seasonId));
  if (!parsed.ok) return { error: invalid(parsed.fieldErrors), values };
  const error = await saveSeason(propertyId, seasonId, parsed.value);
  if (error) return { error: withMessage(error), values };
  revalidatePath(RATES_ROUTE, "page");
  redirect(ratesHref(propertyId, { tab: "seasons" }));
}

export async function deleteSeasonAction(formData: FormData) {
  const allowed = await mayManage();
  const propertyId = idField(formData, "propertyId");
  if (!propertyId) redirect("/");
  if (!allowed) redirect(ratesHref(propertyId, { tab: "seasons", error: "FORBIDDEN" }));
  const error = await deleteSeason(propertyId, field(formData, "seasonId"));
  // Already gone is the outcome the user asked for.
  if (error && error.code !== "NOT_FOUND") redirect(ratesHref(propertyId, { tab: "seasons", error: withMessage(error).code as RatesErrorCode }));
  revalidatePath(RATES_ROUTE, "page");
  redirect(ratesHref(propertyId, { tab: "seasons" }));
}

export async function createPlanAction(previous: DialogFormState<PlanInput>, formData: FormData): Promise<DialogFormState<PlanInput>> {
  const values = { name: field(formData, "name"), description: field(formData, "description"), copyFrom: field(formData, "copyFrom") };
  if (!(await mayManage())) return { error: forbidden(), values };
  const propertyId = idField(formData, "propertyId");
  if (!propertyId) return { error: failed(), values };

  const parsed = validatePlan(values, await getPlanNames(propertyId));
  if (!parsed.ok) return { error: invalid(parsed.fieldErrors), values };
  const result = await createPlan(propertyId, parsed.value);
  if ("status" in result) return { error: withMessage(result), values };
  revalidatePath(RATES_ROUTE, "page");
  redirect(ratesHref(propertyId, { planId: result.id }));
}
