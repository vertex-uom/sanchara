import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { colomboDateKey } from "@/lib/format/dates";
import { getCompanyProperties } from "@/features/properties";
import {
  AuditChips,
  AuditDetail,
  AuditFilters,
  AuditHeader,
  auditHref,
  AuditList,
  AuditPagination,
  AuditSkeleton,
  getAuditEntry,
  getAuditPage,
  parseAuditParams,
} from "@/features/audit";

export const metadata = { title: "Audit Trail" };

type AuditProps = Pick<PageProps<"/backoffice/company/audit">, "searchParams">;

// Owner-only, read-only audit trail. Filters and the open record live in the URL.
export default function Page({ searchParams }: PageProps<"/backoffice/company/audit">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-4 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<AuditSkeleton />}>
        <AuditTrail searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AuditTrail({ searchParams }: AuditProps) {
  const [query, user] = await Promise.all([searchParams, getCurrentStaff(), connection()]);
  if (!can(user, "audit.read")) redirect("/forbidden");

  const { entryId, ...params } = parseAuditParams(query, colomboDateKey(new Date()));
  // Company pages have no property in the URL; like the shell, use the first one.
  const [property] = await getCompanyProperties();
  if (!property) notFound();

  const [data, entry] = await Promise.all([
    getAuditPage(property.id, params),
    entryId ? getAuditEntry(property.id, entryId) : null,
  ]);
  // A page past the end shows the last page; keep links consistent with it.
  const filters = { ...params, page: data.page };

  return (
    <>
      <AuditHeader />
      <AuditChips filters={filters} counts={data.counts} />
      <AuditFilters filters={filters} actors={data.actors} />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AuditList entries={data.entries} filters={filters} selectedId={entry?.id ?? null} />
          <AuditPagination page={data.page} pageSize={data.pageSize} total={data.total} filters={filters} />
        </div>
        {entry ? (
          <AuditDetail
            entry={entry}
            propertyName={entry.propertyId ? property.name : "Company-wide"}
            closeHref={auditHref(filters)}
          />
        ) : null}
      </div>
    </>
  );
}
