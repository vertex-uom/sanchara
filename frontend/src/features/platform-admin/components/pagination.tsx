import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "../sidebar-modes";
import type { Paged } from "../types";

const PAGE_BUTTON = "focus-ring inline-flex size-[26px] items-center justify-center rounded-md text-[11px] font-medium";

// "Showing 1–8 of 124" with 26px page buttons; the current page is outlined
// in the brand colour. `hrefFor` builds the link for a page number.
export function AdminPagination({ result, hrefFor, label }: { result: Paged<unknown>; hrefFor: (page: number) => string; label: string }) {
  if (result.total === 0) return null;
  const pages = Math.max(Math.ceil(result.total / result.pageSize), 1);
  const from = (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

  return (
    <nav aria-label={label} className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[11px] text-admin-muted-text">
        Showing {from}–{to} of {result.total.toLocaleString("en-US")}
      </p>
      {pages > 1 ? (
        <ul className="flex items-center gap-1">
          <li>
            <PageLink href={hrefFor(result.page - 1)} disabled={result.page === 1} label="Previous page" className={cn(PAGE_BUTTON, "text-admin-icon")}>
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
                  href={hrefFor(page)}
                  aria-current={page === result.page ? "page" : undefined}
                  className={cn(PAGE_BUTTON, page === result.page ? "border border-admin-primary text-admin-heading" : "text-admin-body hover:bg-admin-muted")}
                >
                  {page}
                </Link>
              </li>
            ),
          )}
          <li>
            <PageLink href={hrefFor(result.page + 1)} disabled={result.page === pages} label="Next page" className={cn(PAGE_BUTTON, "text-admin-icon")}>
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
