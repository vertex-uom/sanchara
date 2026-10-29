import { BedSingle, House, Info } from "lucide-react";
import { formatDateTimeParts } from "@/lib/format/dates";
import { Avatar } from "@/components/ui/avatar";
import { UrlDialog } from "@/components/ui/url-dialog";
import { ROLE_META } from "@/features/staff";
import type { AuditRecord } from "../types";
import { AuditValueText } from "./audit-parts";

type AuditDetailProps = { entry: AuditRecord; propertyName: string; closeHref: string };

const headClass = "px-3 py-2.5 text-left text-sm font-semibold text-office-muted";

// Server-rendered from ?entry=<id>. Side panel from xl, full-screen sheet below;
// focus stays inside until it closes and then returns to the View button.
export function AuditDetail({ entry, propertyName, closeHref }: AuditDetailProps) {
  const { date, time } = formatDateTimeParts(entry.occurredAt);
  return (
    <UrlDialog title={entry.title} closeHref={closeHref} variant="panel" trapFocus className="xl:w-88">
      <div className="flex items-center gap-3">
        <Avatar id={entry.actor.id} name={entry.actor.name} className="size-10 text-sm" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{entry.actor.name}</span>
            <span className="rounded-md bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
              {ROLE_META[entry.actor.role].label}
            </span>
          </p>
          <p className="text-sm text-office-muted">
            <time dateTime={entry.occurredAt}>
              {date} at {time}
            </time>
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="grid grid-cols-[7rem_1fr] items-center gap-2">
          <dt className="flex items-center gap-2 text-office-muted">
            <House aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
            Property
          </dt>
          <dd className="font-semibold">{propertyName}</dd>
        </div>
        <div className="grid grid-cols-[7rem_1fr] items-center gap-2">
          <dt className="flex items-center gap-2 text-office-muted">
            <BedSingle aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
            Unit
          </dt>
          <dd className="font-semibold">{entry.unit ?? <AuditValueText value={null} />}</dd>
        </div>
      </dl>

      <h3 className="mt-5 mb-3 text-lg font-semibold">Changes</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <caption className="sr-only">Changes, before and after</caption>
          <thead className="bg-office-chip">
            <tr>
              <th scope="col" className={headClass}>
                Field
              </th>
              <th scope="col" className={headClass}>
                Before
              </th>
              <th scope="col" className={headClass}>
                After
              </th>
            </tr>
          </thead>
          <tbody>
            {entry.changes.map((change) => (
              <tr key={change.field} className="border-t border-border">
                <th scope="row" className="px-3 py-2.5 text-left font-normal">
                  {change.field}
                </th>
                <td className="px-3 py-2.5">
                  <AuditValueText value={change.before} />
                </td>
                <td className="px-3 py-2.5 font-semibold">
                  <AuditValueText value={change.after} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 flex gap-2 rounded-lg bg-office-tint-blue p-3 text-sm text-office-label">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-ink-blue" />
        Audit records cannot be edited or deleted.
      </p>
    </UrlDialog>
  );
}
