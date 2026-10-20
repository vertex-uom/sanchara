import { ChipLink } from "@/components/ui/chip-link";
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
            <ChipLink href={reportHref(path, filters, { tab: key })} active={key === active} current="page">
              {REPORT_LABELS[key]}
            </ChipLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
