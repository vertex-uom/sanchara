import { propertyPath } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { PACKAGE_ERROR_MESSAGES, PACKAGE_STATUSES, type PackageErrorCode } from "./config";
import type { PackageStatus } from "./types";

// Packages page state lives in the URL: filters (?status, ?q), the selected
// package (?package=<id>), the open dialog (?panel=new|delete) and ?error
// after a refused delete.

export type PackageFilters = { status: PackageStatus | null; q: string };

export type PackagePanel = "new" | "delete";

export type PackageParams = PackageFilters & { packageId: string | null; panel: PackagePanel | null; error: PackageErrorCode | null };

const PANELS: PackagePanel[] = ["new", "delete"];

const MAX_QUERY_LENGTH = 100;
const PACKAGE_ID = /^[a-z0-9_-]{1,64}$/;

// Whitelists the URL; anything invalid falls back to "no filter, nothing open".
export function parsePackageParams(query: SearchParams): PackageParams {
  const packageId = single(query.package);
  const error = single(query.error);
  return {
    status: PACKAGE_STATUSES.find((status) => status === single(query.status)) ?? null,
    q: (single(query.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    packageId: packageId && PACKAGE_ID.test(packageId) ? packageId : null,
    panel: PANELS.find((panel) => panel === single(query.panel)) ?? null,
    error: error && Object.hasOwn(PACKAGE_ERROR_MESSAGES, error) ? (error as PackageErrorCode) : null,
  };
}

export function packagesPath(propertyId: string) {
  return propertyPath(propertyId, "packages");
}

// Packages page link that keeps the filters; pass a package to select it.
export function packagesHref(
  propertyId: string,
  filters: PackageFilters,
  open: { packageId?: string | null; panel?: PackagePanel; error?: PackageErrorCode } = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (open.packageId) params.set("package", open.packageId);
  if (open.panel) params.set("panel", open.panel);
  if (open.error) params.set("error", open.error);
  const query = params.toString();
  return query ? `${packagesPath(propertyId)}?${query}` : packagesPath(propertyId);
}
