import Form from "next/form";
import Link from "next/link";
import { BedDouble, ChevronRight, Search } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { ChipLink } from "@/components/ui/chip-link";
import { ToneChip } from "@/components/ui/tone-chip";
import { EmptyState, FlatCard } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { STATUS_META } from "../config";
import { packagesHref, packagesPath, type PackageFilters } from "../package-params";
import type { PackageList as List, PackageStatus } from "../types";
import { THEME_ICONS } from "./package-icons";

type PackageListProps = { propertyId: string; list: List; filters: PackageFilters; selectedId: string | null };

const CHIPS: { label: string; status: PackageStatus | null; count: keyof List["counts"] }[] = [
  { label: "All", status: null, count: "all" },
  { label: "Active", status: "active", count: "active" },
  { label: "Draft", status: "draft", count: "draft" },
];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Search (a GET form that keeps the chip), status chips and the package cards.
// Each card is a link that selects the package; the editor shows it.
export function PackageList({ propertyId, list, filters, selectedId }: PackageListProps) {
  return (
    <FlatCard aria-labelledby="packages-list-title" className="flex flex-col gap-4 xl:sticky xl:top-20">
      <h2 id="packages-list-title" className="sr-only">
        Package list
      </h2>
      <Form key={filters.q} action={packagesPath(propertyId)} scroll={false} role="search" className="relative">
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        <label htmlFor="package-search" className="sr-only">
          Search packages
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-office-icon" />
        <input
          id="package-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search packages…"
          className="focus-ring h-11 w-full rounded-lg border border-border bg-card pr-3 pl-10 text-sm text-foreground placeholder:text-office-muted md:h-10"
        />
      </Form>

      <ul aria-label="Filter packages by status" className="flex flex-wrap gap-2">
        {CHIPS.map(({ label, status, count }) => (
          <li key={label}>
            <ChipLink size="sm" href={packagesHref(propertyId, { status, q: filters.q })} active={status === filters.status}>
              {label} ({list.counts[count]})
            </ChipLink>
          </li>
        ))}
      </ul>

      {list.packages.length === 0 ? (
        <EmptyState>{filters.q || filters.status ? "No packages match your filters." : "No packages yet. Create one to get started."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.packages.map((item) => {
            const Icon = THEME_ICONS[item.theme];
            const selected = item.id === selectedId;
            const status = STATUS_META[item.status];
            return (
              <li key={item.id}>
                <Link
                  href={packagesHref(propertyId, filters, { packageId: item.id })}
                  scroll={false}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "focus-ring flex items-center gap-3 rounded-xl border bg-card px-3 py-3.5 transition-colors hover:bg-office-nav-active motion-reduce:transition-none",
                    selected ? "border-office-primary bg-office-nav-active ring-1 ring-office-primary" : "border-border",
                  )}
                >
                  <Icon aria-hidden="true" className="size-6 shrink-0 text-office-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{item.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-office-muted">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble aria-hidden="true" className="size-3.5" />
                        {plural(item.nights, "night")}
                      </span>
                      <ToneChip tone={status.tone} dot={item.status === "active"}>
                        {status.label}
                      </ToneChip>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs text-office-muted">From</span>
                    <span className="block text-sm font-semibold whitespace-nowrap text-foreground">{formatMoney(item.fromPrice)}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </FlatCard>
  );
}
