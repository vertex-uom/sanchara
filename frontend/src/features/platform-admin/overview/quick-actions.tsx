import { Megaphone, Plus, Search } from "lucide-react";
import { adminNavItem } from "../nav";
import { AdminButtonLink } from "../components/ui";

// Shortcuts into the queues an admin works most. Each opens the owning tab;
// deep links (the create-company flow, search box) arrive with those tabs.
export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      <AdminButtonLink href={`${adminNavItem("onboarding").href}/new`} icon={Plus} variant="primary">
        Create company
      </AdminButtonLink>
      <AdminButtonLink href={adminNavItem("users").href} icon={Search}>
        Search user
      </AdminButtonLink>
      <AdminButtonLink href={adminNavItem("announcements").href} icon={Megaphone}>
        Create announcement
      </AdminButtonLink>
    </nav>
  );
}
