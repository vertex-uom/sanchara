import { propertyPath } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { SETTINGS_ERROR_MESSAGES, SETTINGS_TABS, type SettingsErrorCode, type SettingsTab } from "./config";

// Settings page state lives in the URL: the tab (?tab), the deactivate
// dialog (?panel=deactivate) and ?error after a refused status change.

export type SettingsParams = { tab: SettingsTab; deactivating: boolean; error: SettingsErrorCode | null };

export function parseSettingsParams(query: SearchParams): SettingsParams {
  const error = single(query.error);
  return {
    tab: SETTINGS_TABS.find(({ key }) => key === single(query.tab))?.key ?? "basic",
    deactivating: single(query.panel) === "deactivate",
    error: error && Object.hasOwn(SETTINGS_ERROR_MESSAGES, error) ? (error as SettingsErrorCode) : null,
  };
}

export function settingsHref(propertyId: string, open: { tab?: SettingsTab; deactivating?: boolean; error?: SettingsErrorCode } = {}) {
  const params = new URLSearchParams();
  if (open.tab && open.tab !== "basic") params.set("tab", open.tab);
  if (open.deactivating) params.set("panel", "deactivate");
  if (open.error) params.set("error", open.error);
  const query = params.toString();
  const path = propertyPath(propertyId, "settings");
  return query ? `${path}?${query}` : path;
}
