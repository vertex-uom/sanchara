import { Suspense } from "react";
import Link from "next/link";
import { Globe, Link2, Lock } from "lucide-react";
import { formatDate, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getCustomDomainCounts, getDomainSettings, listCustomDomains } from "../server/configuration";
import { configurationHref } from "./search-params";
import { CUSTOM_DOMAIN_STATUS_META } from "./status";

// Domains tab: the custom domains companies have pointed at the platform
// (checked automatically; nothing to press), above the fixed platform hosts
// and the subdomains companies cannot take. The table takes the full width
// so its four columns fit without scrolling at 1440.
export function DomainsTab({ page }: { page: number }) {
  return (
    <div className="flex flex-col gap-4">
      <CustomDomains page={page} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
        <PlatformHosts />
        <ReservedSubdomains />
      </div>
    </div>
  );
}

const COLUMNS = ["Company", "Hostname", "Status", "Last check"];

function CustomDomains({ page }: { page: number }) {
  return (
    <AdminCard aria-labelledby="custom-domains-title">
      <Suspense fallback={<TableSkeleton />}>
        <CustomDomainsBody page={page} />
      </Suspense>
    </AdminCard>
  );
}

async function CustomDomainsBody({ page }: { page: number }) {
  const [result, counts, settings] = await Promise.all([listCustomDomains(page), getCustomDomainCounts(), getDomainSettings()]);
  const now = new Date();
  const attention = counts.pending + counts.failed;

  return (
    <>
      <AdminCardHeader
        id="custom-domains-title"
        icon={Link2}
        title="Custom domains"
        chip={<AdminChip tone="neutral">{counts.all}</AdminChip>}
        action={attention > 0 ? <AdminChip tone={counts.failed > 0 ? "danger" : "warning"}>{attention} need DNS</AdminChip> : null}
      />
      <p className="-mt-1.5 mb-3.5 text-[11.5px] text-admin-muted-text">
        Owners add these in Back Office. DNS and certificates are checked automatically every {settings.checkIntervalMinutes} minutes until the domain verifies; there is nothing to do here.
      </p>

      {result.items.length === 0 ? (
        <AdminTableEmpty>No custom domains yet.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={640}>
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
            {result.items.map((domain) => {
              const status = CUSTOM_DOMAIN_STATUS_META[domain.status];
              return (
                <tr key={domain.id} className={cn("relative transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none", TABLE_ROW)}>
                  <td className={cn(TABLE_CELL, "min-w-[150px]")}>
                    {/* Stretched link: the row opens the company in Accounts & Enforcement. */}
                    <Link href={`${adminNavItem("accounts").href}/${encodeURIComponent(domain.companyId)}`} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                      {domain.companyName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal whitespace-nowrap text-admin-muted-text">
                      Requested <time dateTime={domain.requestedAt}>{formatDate(new Date(domain.requestedAt))}</time>
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "font-mono text-[12px] whitespace-nowrap")}>{domain.hostname}</td>
                  <td className={cn(TABLE_CELL, "min-w-[200px]")}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                    {domain.issue ? <span className="mt-1 block text-[11px] font-normal whitespace-nowrap text-admin-danger">{domain.issue}</span> : null}
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <time dateTime={domain.checkedAt}>{formatRelativeDateTime(domain.checkedAt, now)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      <AdminPagination result={result} label="Custom domains pages" hrefFor={(next) => configurationHref("domains", next)} />
    </>
  );
}

function PlatformHosts() {
  return (
    <AdminCard aria-labelledby="platform-hosts-title">
      <AdminCardHeader id="platform-hosts-title" icon={Globe} title="Platform hosts" />
      <Suspense fallback={<HostsSkeleton />}>
        <PlatformHostsBody />
      </Suspense>
    </AdminCard>
  );
}

async function PlatformHostsBody() {
  const settings = await getDomainSettings();
  const hosts: { label: string; host: string }[] = [
    { label: "Company sites", host: `{subdomain}.${settings.platformDomain}` },
    { label: "Central site", host: settings.centralHost },
    { label: "Back Office", host: settings.backOfficeHost },
    { label: "Admin console", host: settings.adminHost },
  ];
  return (
    <>
      <dl className="flex flex-col gap-2 text-[12.5px]">
        {hosts.map(({ label, host }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-admin-muted-text">{label}</dt>
            <dd className="text-right font-mono text-[12px] font-medium break-all text-admin-heading">{host}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11.5px] leading-snug text-admin-muted-text">Each company gets a subdomain when it is approved; custom domains are added on top and resolve to the same site.</p>
    </>
  );
}

function ReservedSubdomains() {
  return (
    <AdminCard aria-labelledby="reserved-subdomains-title">
      <AdminCardHeader id="reserved-subdomains-title" icon={Lock} title="Reserved subdomains" />
      <Suspense fallback={<HostsSkeleton />}>
        <ReservedSubdomainsBody />
      </Suspense>
    </AdminCard>
  );
}

async function ReservedSubdomainsBody() {
  const settings = await getDomainSettings();
  return (
    <>
      <ul className="flex flex-col">
        {settings.reserved.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 border-b border-admin-border py-2 text-[12.5px] first:pt-0 last:border-b-0 last:pb-0">
            <span className="font-mono text-[12px] font-medium text-admin-heading">{entry.name}</span>
            <span className="text-right text-[11.5px] text-admin-muted-text">{entry.purpose}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-snug text-admin-muted-text">Companies cannot choose these as their subdomain.</p>
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading custom domains</span>
      <AdminSkeleton className="mb-4 h-6 w-48" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

function HostsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading</span>
      {Array.from({ length: 4 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
    </div>
  );
}
