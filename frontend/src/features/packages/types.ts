import type { Money } from "@/lib/format/money";

export type PackageStatus = "active" | "draft";

// Picks the package's icon; activities use it too.
export type PackageTheme = "surf" | "wellness" | "hill-country" | "general";

export type ItemKind = "room" | "meal" | "transfer" | "activity";

// "online": part of the online payment; "property": paid at the property, no price shown.
export type PaymentMode = "online" | "property";

export type RoomAvailability = "available" | "limited" | "unavailable";

export type PackageItem = {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  payment: PaymentMode;
  // Null when paid at the property.
  price: Money | null;
  // Rooms only, from the availability API; null until it has been checked.
  availability: RoomAvailability | null;
};

export type PackageDay = { id: string; title: string; note: string; items: PackageItem[] };

// Calculated by the API (pricing); the frontend shows them as returned.
export type PackageTotals = { payOnline: Money; payOnlineUsd: Money; hasPayAtProperty: boolean };

export type PackageDetail = {
  id: string;
  name: string;
  tagline: string;
  theme: PackageTheme;
  status: PackageStatus;
  nights: number;
  days: PackageDay[];
  totals: PackageTotals;
  // Bumped on every save; a stale save is refused.
  version: number;
};

export type PackageSummary = Pick<PackageDetail, "id" | "name" | "theme" | "status" | "nights"> & { fromPrice: Money };

export type PackageList = {
  packages: PackageSummary[];
  // Counts for the filter chips, with the search applied.
  counts: Record<PackageStatus | "all", number>;
};
