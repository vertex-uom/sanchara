import { adminNavItem, type AdminNavKey } from "./nav";

// Route metadata for a Platform Admin tab, from the nav config.
export function adminPageMetadata(navKey: AdminNavKey) {
  const item = adminNavItem(navKey);
  return { title: item.label, description: item.description };
}
