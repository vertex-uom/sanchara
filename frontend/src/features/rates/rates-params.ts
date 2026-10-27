import { propertyPath } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { RATES_ERROR_MESSAGES, RATES_TABS, RESIDENCIES, type RatesErrorCode, type RatesTab } from "./config";
import type { Residency } from "./types";

// Rates page state lives in the URL: the tab (?tab), the grid shown
// (?residency, ?plan), the open dialog (?panel with ?season) and ?error.

export type RatesPanel = "add-season" | "edit-season" | "delete-season" | "add-plan";

export type RatesParams = {
  tab: RatesTab;
  residency: Residency;
  planId: string | null;
  panel: RatesPanel | null;
  seasonId: string | null;
  error: RatesErrorCode | null;
};

const PANELS: RatesPanel[] = ["add-season", "edit-season", "delete-season", "add-plan"];
const ID = /^[a-z0-9_-]{1,64}$/;

const id = (value: string | undefined) => (value && ID.test(value) ? value : null);

export function parseRatesParams(query: SearchParams): RatesParams {
  const error = single(query.error);
  return {
    tab: RATES_TABS.find(({ key }) => key === single(query.tab))?.key ?? "rates",
    residency: RESIDENCIES.find((value) => value === single(query.residency)) ?? "resident",
    planId: id(single(query.plan)),
    panel: PANELS.find((panel) => panel === single(query.panel)) ?? null,
    seasonId: id(single(query.season)),
    error: error && Object.hasOwn(RATES_ERROR_MESSAGES, error) ? (error as RatesErrorCode) : null,
  };
}

type RatesHrefState = {
  tab?: RatesTab;
  residency?: Residency;
  planId?: string | null;
  panel?: RatesPanel;
  seasonId?: string;
  error?: RatesErrorCode;
};

// Defaults (Rates tab, residents, first plan) are left out of the URL.
export function ratesHref(propertyId: string, state: RatesHrefState = {}) {
  const params = new URLSearchParams();
  if (state.tab && state.tab !== "rates") params.set("tab", state.tab);
  if (state.residency && state.residency !== "resident") params.set("residency", state.residency);
  if (state.planId) params.set("plan", state.planId);
  if (state.panel) params.set("panel", state.panel);
  if (state.seasonId) params.set("season", state.seasonId);
  if (state.error) params.set("error", state.error);
  const query = params.toString();
  const path = propertyPath(propertyId, "rates");
  return query ? `${path}?${query}` : path;
}
