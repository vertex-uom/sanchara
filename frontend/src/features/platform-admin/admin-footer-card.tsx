import { Crown } from "lucide-react";
import { ICON_STROKE } from "./sidebar-modes";

// Environment card at the bottom of the sidebar.
// TODO: read environment and version from runtime config instead of constants.
const ENVIRONMENT = "Production";
const VERSION = "v2.4.1";

export function AdminFooterCard() {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-admin-border bg-admin-card p-3.5">
      <Crown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6.5 shrink-0 text-admin-icon" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-admin-heading">Sanchara Admin</p>
        <p className="text-[11px] text-admin-teal">
          {ENVIRONMENT} · {VERSION}
        </p>
      </div>
    </div>
  );
}
