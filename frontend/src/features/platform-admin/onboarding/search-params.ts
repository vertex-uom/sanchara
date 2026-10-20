import { adminNavItem } from "../nav";

// Only the list page lives in the URL; the create flow is its own route.

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(params: SearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function onboardingHref(page = 1) {
  return `${adminNavItem("onboarding").href}${page > 1 ? `?page=${page}` : ""}`;
}

export function newCompanyHref() {
  return `${adminNavItem("onboarding").href}/new`;
}
