import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getRecentCompanies } from "../server/overview";
import type { CompanyStatus, Tone } from "../types";

const STATUS_META: Record<CompanyStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
};

const HEAD_CELL = "px-3 py-[9px] text-left text-[11px] font-medium text-admin-muted-text first:rounded-l-md last:rounded-r-md";
const CELL = "px-3 py-[11px] text-[12.5px] font-medium text-admin-heading";

export function RecentCompanies() {
  return (
    <AdminCard aria-labelledby="recent-companies-title">
      <AdminCardHeader
        id="recent-companies-title"
        icon={Building2}
        title="Recently onboarded companies"
        action={
          <AdminLink href={adminNavItem("accounts").href} srContext="companies">
            View all
          </AdminLink>
        }
      />
      <Suspense fallback={<CompaniesSkeleton />}>
        <CompaniesTable />
      </Suspense>
    </AdminCard>
  );
}

async function CompaniesTable() {
  const companies = await getRecentCompanies();

  if (companies.length === 0) {
    return <p className="rounded-xl border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted-text">No companies onboarded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0">
        <thead>
          <tr className="bg-admin-muted">
            <th scope="col" className={HEAD_CELL}>
              Company
            </th>
            <th scope="col" className={HEAD_CELL}>
              Plan
            </th>
            <th scope="col" className={HEAD_CELL}>
              Status
            </th>
            <th scope="col" className={HEAD_CELL}>
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const status = STATUS_META[company.status];
            return (
              <tr key={company.id} className="[&>td]:border-b [&>td]:border-admin-border last:[&>td]:border-b-0">
                <td className={CELL}>
                  <span className="block font-semibold">{company.name}</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">{company.location}</span>
                </td>
                <td className={CELL}>{company.plan}</td>
                <td className={CELL}>
                  <AdminChip tone={status.tone} dot>
                    {status.label}
                  </AdminChip>
                </td>
                <td className={CELL}>
                  <time dateTime={company.joinedAt}>{formatDateOnly(company.joinedAt)}</time>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompaniesSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading companies</span>
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
