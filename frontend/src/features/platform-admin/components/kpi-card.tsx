import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ICON_STROKE } from "../sidebar-modes";
import { AdminSkeleton } from "./ui";

// KPI card from the design system: radius 14, padding 18, 24px icon with a
// 13px label, 24px value, optional chip row and a 10.5px breakdown line.
export function AdminKpiCard({
  icon: Icon,
  label,
  value,
  chip,
  chipNote,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  chip?: ReactNode;
  // Text after the chip, e.g. "vs last month".
  chipNote?: string;
  note: string;
}) {
  return (
    <li className="flex flex-col gap-2.5 rounded-[14px] border border-admin-border bg-admin-card p-4.5">
      <div className="flex items-center gap-2.5">
        <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 shrink-0 text-admin-icon" />
        <h3 className="text-[13px] font-medium text-admin-body">{label}</h3>
      </div>
      <p className="text-2xl font-semibold text-admin-heading">{value}</p>
      {chip ? (
        <p className="flex items-center gap-1.5 text-[11px] text-admin-muted-text">
          {chip}
          {chipNote}
        </p>
      ) : null}
      <p className="text-[10.5px] text-admin-muted-text">{note}</p>
    </li>
  );
}

export const KPI_GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

export function AdminKpiSkeleton({ count, label }: { count: number; label: string }) {
  return (
    <div aria-busy="true" className={KPI_GRID}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <AdminSkeleton key={i} className="h-37.5 rounded-[14px]" />
      ))}
    </div>
  );
}
