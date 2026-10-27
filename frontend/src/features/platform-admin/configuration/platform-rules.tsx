import { Archive, Ban, Clock, Coins, FileClock, Lock, ScrollText, type LucideIcon } from "lucide-react";
import { AdminCard, AdminCardHeader } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";

// Rules fixed by the architecture and the platform team. Stated as facts;
// nothing here is a setting the console can change.
const RULES: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: Ban,
    title: "Non-payment blocks access the same day",
    detail: "There is no grace period. When a renewal fails, Back Office is blocked for every staff account and a full report of the company's bookings is emailed to the Owner and Managers.",
  },
  {
    icon: Clock,
    title: "Paying within one year restores everything",
    detail: "The company's data is kept for one year from the day it was blocked. A successful payment in that time lifts the suspension automatically; no admin action is needed.",
  },
  {
    icon: Archive,
    title: "Closed after one year unpaid",
    detail: "If nothing is paid within the year the company is closed and its properties, staff accounts and bookings are deleted. Nothing can be restored; the owner may apply again as a new company.",
  },
  {
    icon: ScrollText,
    title: "Administrator suspensions are manual both ways",
    detail: "A company suspended by the platform team stays suspended until an admin reactivates it from Accounts & Enforcement. Payment does not lift it.",
  },
  {
    icon: Lock,
    title: "Admin sign-in",
    detail: "Email and password, then mandatory two-step verification; sessions end after a short idle period. Every admin has the same Platform Admin access.",
  },
  {
    icon: FileClock,
    title: "Audit trail kept one year",
    detail: "Who changed what and when for rates, reservations, payments, refunds, blocks and staff accounts. Visible to company Owners only; Platform Admin sees its own actions in Audit Logs.",
  },
  {
    icon: Coins,
    title: "Reservations keep their exchange rate",
    detail: "Rate plans are priced in LKR for residents and USD for non-residents. Each reservation stores the platform rate in force when it was quoted; later changes never alter it.",
  },
];

export function PlatformRules() {
  return (
    <AdminCard aria-labelledby="platform-rules-title">
      <AdminCardHeader id="platform-rules-title" icon={ScrollText} title="Platform rules" />
      <ul className="flex flex-col">
        {RULES.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3 border-b border-admin-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-admin-heading">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-admin-muted-text">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}
