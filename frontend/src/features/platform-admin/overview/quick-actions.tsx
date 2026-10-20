import { Megaphone, Search, UserRoundCheck } from "lucide-react";
import { adminNavItem } from "../nav";
import { AdminButtonLink } from "../components/ui";

// Shortcuts into the queues an admin works most. Each opens the owning tab;
// deep links (next application, search box) arrive with those tabs.
export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      <AdminButtonLink href={adminNavItem("onboarding").href} icon={UserRoundCheck} variant="primary">
        Review next application
      </AdminButtonLink>
      <AdminButtonLink href={adminNavItem("users").href} icon={Search}>
        Search user
      </AdminButtonLink>
      <AdminButtonLink href={adminNavItem("help").href} icon={Megaphone}>
        Create announcement
      </AdminButtonLink>
    </nav>
  );
}
