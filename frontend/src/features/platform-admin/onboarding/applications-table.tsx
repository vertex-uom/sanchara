import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { applicationAgeDays, isOverdueApplication, listApplications } from "../server/onboarding";
import type { ApplicationFilters, Paged } from "../types";
import { applicationHref, applicationsHref } from "./search-params";
import { SortSelect } from "./sort-select";
import { APPLICATION_STATUS_META, formatAge } from "./status";

const HEAD_CELL = "px-3 py-[9px] text-left text-[11px] font-medium whitespace-nowrap text-admin-muted-text first:rounded-l-md last:rounded-r-md";
const CELL = "px-3 py-[11px] text-[12.5px] font-medium text-admin-heading";

export function ApplicationsTable({ filters, selectedId, className }: { filters: ApplicationFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="applications-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: ApplicationFilters; selectedId?: string }) {
  const result = await listApplications(filters);
  const now = new Date();

  return (
    <>
      <AdminCardHeader
        id="applications-title"
        icon={List}
        title="Applications"
        chip={<AdminChip tone="neutral">{result.total}</AdminChip>}
        action={<SortSelect filters={filters} />}
      />

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted-text">No applications match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-admin-muted">
                <th scope="col" className={HEAD_CELL}>
                  Business / Applicant
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Region
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Type
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Status
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Age
                </th>
                <th scope="col" className={HEAD_CELL}>
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((application) => {
                const status = APPLICATION_STATUS_META[application.status];
                const overdue = isOverdueApplication(application, now);
                const selected = application.id === selectedId;
                return (
                  <tr
                    key={application.id}
                    className={cn(
                      "relative transition-colors motion-reduce:transition-none [&>td]:border-b [&>td]:border-admin-border last:[&>td]:border-b-0",
                      selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60",
                    )}
                  >
                    <td className={CELL}>
                      {/* Stretched link: the whole row opens the application. */}
                      <Link
                        href={applicationHref(application.id, filters)}
                        aria-current={selected ? "page" : undefined}
                        className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']"
                      >
                        {application.businessName}
                      </Link>
                      <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">{application.applicantName}</span>
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap")}>{application.region}</td>
                    <td className={cn(CELL, "whitespace-nowrap")}>{application.businessType}</td>
                    <td className={CELL}>
                      <AdminChip tone={status.tone} dot>
                        {status.label}
                      </AdminChip>
                    </td>
                    <td className={cn(CELL, overdue && "text-admin-danger")}>
                      {formatAge(applicationAgeDays(application, now))}
                      {overdue ? <span className="sr-only"> (overdue)</span> : null}
                    </td>
                    <td className={cn(CELL, "whitespace-nowrap")}>
                      <time dateTime={application.submittedAt}>{formatDateOnly(application.submittedAt.slice(0, 10))}</time>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination result={result} filters={filters} selectedId={selectedId} />
    </>
  );
}

function Pagination({ result, filters, selectedId }: { result: Paged<unknown>; filters: ApplicationFilters; selectedId?: string }) {
  const pages = Math.max(Math.ceil(result.total / result.pageSize), 1);
  if (result.total === 0) return null;

  const from = (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);
  // Paging keeps the open application (if any) in the side panel.
  const href = (page: number) => (selectedId ? applicationHref(selectedId, { ...filters, page }) : applicationsHref({ ...filters, page }));
  const pageButton = "focus-ring inline-flex size-[26px] items-center justify-center rounded-md text-[11px] font-medium";

  return (
    <nav aria-label="Applications pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[11px] text-admin-muted-text">
        Showing {from}–{to} of {result.total}
      </p>
      {pages > 1 ? (
        <ul className="flex items-center gap-1">
          <li>
            <PageLink href={href(result.page - 1)} disabled={result.page === 1} label="Previous page" className={cn(pageButton, "text-admin-icon")}>
              <ChevronLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
            </PageLink>
          </li>
          {pageNumbers(result.page, pages).map((page, i) =>
            page === null ? (
              <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-[11px] text-admin-muted-text">
                …
              </li>
            ) : (
              <li key={page}>
                <Link
                  href={href(page)}
                  aria-current={page === result.page ? "page" : undefined}
                  className={cn(pageButton, page === result.page ? "border border-admin-primary text-admin-heading" : "text-admin-body hover:bg-admin-muted")}
                >
                  {page}
                </Link>
              </li>
            ),
          )}
          <li>
            <PageLink href={href(result.page + 1)} disabled={result.page === pages} label="Next page" className={cn(pageButton, "text-admin-icon")}>
              <ChevronRight aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
            </PageLink>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}

function PageLink({ href, disabled, label, className, children }: { href: string; disabled: boolean; label: string; className: string; children: ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(className, "hover:bg-admin-muted")}>
      {children}
    </Link>
  );
}

// 1 … 4 5 6 … 16 — always the first, last and the current page's neighbours.
export function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? [null, page] : [page]));
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading applications</span>
      <AdminSkeleton className="mb-4 h-[38px]" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
