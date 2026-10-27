import { adminNavItem } from "../nav";

// Only the list page lives in the URL; the create flow is its own route.

export function onboardingHref(page = 1) {
  return `${adminNavItem("onboarding").href}${page > 1 ? `?page=${page}` : ""}`;
}

export function newCompanyHref() {
  return `${adminNavItem("onboarding").href}/new`;
}
