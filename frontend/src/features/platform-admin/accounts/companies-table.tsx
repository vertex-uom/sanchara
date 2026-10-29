import { Suspense } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listCompanies } from "../server/companies";
import type { CompanyFilters } from "../types";
import { companiesHref, companyHref } from "./search-params";
import { SortSelect } from "./sort-select";
import { COMPANY_STATUS_META } from "./status";

const COLUMNS = ["Company", "Plan", "Properties", "Staff", "Status", "Joined"];

// Company directory: six columns, the whole row opens the company.
export function CompaniesTable({ filters, selectedId, className }: { filters: CompanyFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="companies-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: CompanyFilters; selectedId?: string }) {
  const result = await listCompanies(filters);

  return (
    <>
      <AdminCardHeader
        id="companies-title"
        icon={Building2}
        title="Companies"
        chip={<AdminChip tone="neutral">{result.total}</AdminChip>}
        action={<SortSelect filters={filters} />}
      />

      {result.items.length === 0 ? (
        <AdminTableEmpty>No companies match these filters.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={620}>
          <thead>
            <tr className="bg-admin-muted">
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className={TABLE_HEAD_CELL}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((company) => {
              const status = COMPANY_STATUS_META[company.status];
              const selected = company.id === selectedId;
              return (
                <tr
                  key={company.id}
                  className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}
                >
                  <td className={TABLE_CELL}>
                    {/* Stretched link: the whole row opens the company. */}
                    <Link
                      href={companyHref(company.id, filters)}
                      aria-current={selected ? "page" : undefined}
                      className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']"
                    >
                      {company.name}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">
                      {company.location} · {company.id}
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{company.plan}</td>
                  <td className={cn(TABLE_CELL, "tabular-nums")}>{company.propertyCount}</td>
                  <td className={cn(TABLE_CELL, "tabular-nums")}>{company.staffCount}</td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <time dateTime={company.joinedAt}>{formatDateOnly(company.joinedAt)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open company (if any) in the side panel. */}
      <AdminPagination
        result={result}
        label="Companies pages"
        hrefFor={(page) => (selectedId ? companyHref(selectedId, { ...filters, page }) : companiesHref({ ...filters, page }))}
      />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading companies</span>
      <AdminSkeleton className="mb-4 h-9.5" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
