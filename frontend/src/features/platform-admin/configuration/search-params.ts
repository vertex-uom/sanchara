import { adminNavItem } from "../nav";

// The active sub-tab and the custom-domains page live in the URL.

export type SearchParams = Record<string, string | string[] | undefined>;

export type ConfigurationTab = "plans" | "domains" | "templates";

const TABS: readonly ConfigurationTab[] = ["plans", "domains", "templates"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTab(params: SearchParams): ConfigurationTab {
  const tab = first(params.tab);
  return TABS.includes(tab as ConfigurationTab) ? (tab as ConfigurationTab) : "plans";
}

export function parsePage(params: SearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function configurationHref(tab: ConfigurationTab = "plans", page = 1) {
  const query = new URLSearchParams();
  if (tab !== "plans") query.set("tab", tab);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return `${adminNavItem("configuration").href}${text ? `?${text}` : ""}`;
}
