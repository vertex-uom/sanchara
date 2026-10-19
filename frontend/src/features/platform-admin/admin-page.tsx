import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/widget";
import { adminNavItem, type AdminNavKey } from "./nav";

// Empty page for a Platform Admin tab: title and description from the nav
// config and an empty state. Real content replaces the empty state per tab.
export function AdminPage({ navKey }: { navKey: AdminNavKey }) {
  const item = adminNavItem(navKey);
  return (
    <div className="flex flex-col gap-6 pt-2">
      <PageHeader title={item.label} description={item.description} />
      <EmptyState>Nothing here yet.</EmptyState>
    </div>
  );
}

export function adminPageMetadata(navKey: AdminNavKey) {
  const item = adminNavItem(navKey);
  return { title: item.label, description: item.description };
}
