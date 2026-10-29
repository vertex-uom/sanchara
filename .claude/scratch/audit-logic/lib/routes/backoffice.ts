// Back Office URLs as seen in the browser (proxy.ts adds the /backoffice prefix).

export function propertyPath(propertyId: string, subPath = "") {
  return `/p/${encodeURIComponent(propertyId)}${subPath ? `/${subPath}` : ""}`;
}

export const COMPANY_PATHS = {
  website: "/company/website",
  staff: "/company/staff",
  subscription: "/company/subscription",
  audit: "/company/audit",
  properties: "/company/properties",
} as const;
