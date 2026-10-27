import { type SearchParams, single } from "@/lib/routes/search-params";
import { adminNavItem } from "../nav";

// The active sub-tab and the custom-domains page live in the URL.

export type ConfigurationTab = "plans" | "domains" | "templates";

const TABS: readonly ConfigurationTab[] = ["plans", "domains", "templates"];

export function parseTab(params: SearchParams): ConfigurationTab {
  const tab = single(params.tab);
  return TABS.includes(tab as ConfigurationTab) ? (tab as ConfigurationTab) : "plans";
}

export function configurationHref(tab: ConfigurationTab = "plans", page = 1) {
  const query = new URLSearchParams();
  if (tab !== "plans") query.set("tab", tab);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return `${adminNavItem("configuration").href}${text ? `?${text}` : ""}`;
}
