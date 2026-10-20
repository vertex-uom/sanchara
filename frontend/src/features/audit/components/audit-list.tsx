import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, FlatCard } from "@/components/ui/widget";
import { ROLE_META } from "@/features/staff";
import { auditHref, type AuditFilters } from "../audit-params";
import type { AuditRecord } from "../types";
import { ActionChip, AuditDateTime, CategoryLabel } from "./audit-parts";

type AuditListProps = { entries: AuditRecord[]; filters: AuditFilters; selectedId: string | null };

const headClass = "px-3 py-3 text-left text-xs font-semibold text-office-muted";
const cellClass = "px-3 py-3 align-middle text-sm";

// Read-only: the only control per row opens the record (?entry=<id>).
function ViewLink({ entry, filters }: { entry: AuditRecord; filters: AuditFilters }) {
  return (
    <Link
      href={auditHref(filters, { entryId: entry.id })}
      scroll={false}
      aria-label={`View details: ${entry.title}`}
      className="focus-ring inline-flex size-11 items-center justify-center rounded-lg text-office-icon transition-colors hover:bg-office-chip motion-reduce:transition-none xl:size-9"
    >
      <Eye aria-hidden="true" className="size-5" />
    </Link>
  );
}

function Actor({ entry }: { entry: AuditRecord }) {
  return (
    <>
      <span className="block font-semibold">{entry.actor.name}</span>
      {/* Role as it was at the time of the change. */}
      <span className="block text-xs text-office-muted">{ROLE_META[entry.actor.role].label}</span>
    </>
  );
}

// A table from xl; the same rows as cards below.
export function AuditList({ entries, filters, selectedId }: AuditListProps) {
  if (entries.length === 0) return <EmptyState>No audit records match your filters.</EmptyState>;

  return (
    <>
      <FlatCard className="hidden p-2 sm:p-2 xl:block">
        <table className="w-full">
          <caption className="sr-only">Audit records, newest first</caption>
          <thead>
            <tr>
              {["Date & time", "Changed by", "Category", "Action", "Record", "Change summary"].map((label) => (
                <th key={label} scope="col" className={headClass}>
                  {label}
                </th>
              ))}
              <th scope="col" className={cn(headClass, "text-center")}>
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className={cn("border-t border-border", entry.id === selectedId && "bg-background")}>
                <th scope="row" className={cn(cellClass, "text-left font-normal")}>
                  <AuditDateTime iso={entry.occurredAt} />
                </th>
                <td className={cellClass}>
                  <Actor entry={entry} />
                </td>
                <td className={cellClass}>
                  <CategoryLabel category={entry.category} />
                </td>
                <td className={cellClass}>
                  <ActionChip action={entry.action} />
                </td>
                <td className={cellClass}>{entry.record}</td>
                <td className={cellClass}>{entry.summary}</td>
                <td className={cn(cellClass, "text-center")}>
                  <ViewLink entry={entry} filters={filters} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FlatCard>

      <ul aria-label="Audit records, newest first" className="space-y-3 xl:hidden">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn("flex gap-3 rounded-xl border border-border bg-card p-4", entry.id === selectedId && "bg-background")}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <AuditDateTime iso={entry.occurredAt} />
                <ActionChip action={entry.action} />
              </div>
              <p className="text-sm">
                <Actor entry={entry} />
              </p>
              <CategoryLabel category={entry.category} />
              <p className="text-sm font-medium">{entry.record}</p>
              <p className="text-sm text-office-label">{entry.summary}</p>
            </div>
            <ViewLink entry={entry} filters={filters} />
          </li>
        ))}
      </ul>
    </>
  );
}
