import Link from "next/link";
import { cn } from "@/lib/utils";
import { REPORT_LABELS, type ReportKey } from "../config";
import { reportHref, type ReportFilters } from "../report-filters";

type ReportTabsProps = { path: string; filters: ReportFilters; reports: ReportKey[]; active: ReportKey };

// Each tab is a link (it changes the URL), so this is a nav, not an ARIA tablist.
// Scrolls sideways on phones; switching tabs keeps the filters.
export function ReportTabs({ path, filters, reports, active }: ReportTabsProps) {
  return (
    <nav aria-label="Reports" className="-mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {reports.map((key) => (
          <li key={key}>
            <Link
              href={reportHref(path, filters, { tab: key })}
              scroll={false}
              aria-current={key === active ? "page" : undefined}
              className={cn(
                "focus-ring inline-flex h-11 items-center rounded-md px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors motion-reduce:transition-none md:h-[2.1875rem] md:px-5",
                key === active ? "bg-office-primary text-white" : "bg-office-chip text-foreground hover:bg-office-pill",
              )}
            >
              {REPORT_LABELS[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
