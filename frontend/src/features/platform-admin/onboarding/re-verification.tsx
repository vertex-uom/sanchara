import { RefreshCw } from "lucide-react";
import { AdminCard } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";

// The Re-verification queue (expiring licences and certificates of existing
// owners) was deferred; the tab stays so the navigation is complete.
// TODO(onboarding): list owners whose documents expire soon, with reminders.
export function ReVerificationPlaceholder() {
  return (
    <AdminCard aria-labelledby="re-verification-title" className="flex flex-col items-center gap-2 py-12 text-center">
      <RefreshCw aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <h2 id="re-verification-title" className="text-base font-semibold text-admin-heading">
        Re-verification is not available yet
      </h2>
      <p className="max-w-md text-[12.5px] text-admin-muted-text">
        Owners whose business registration, tax certificate or tourism licence is about to expire will appear here, with reminders you can send from this
        tab.
      </p>
    </AdminCard>
  );
}
