import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { Button } from "@/components/ui/button";
import { auditHref, type AuditFilters } from "../audit-params";
import type { AuditPage } from "../types";

type AuditPaginationProps = Pick<AuditPage, "page" | "pageSize" | "total"> & { filters: AuditFilters };

const buttonClass = "h-11 gap-1 rounded-lg bg-card px-3 md:h-9";

// "Showing 1–25 of 40" with Previous/Next links; at the ends the link is a disabled button.
export function AuditPagination({ page, pageSize, total, filters }: AuditPaginationProps) {
  if (total === 0) return null;
  const lastPage = Math.ceil(total / pageSize);
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-office-muted">
        Showing {formatCount(first)}–{formatCount(last)} of {formatCount(total)}
      </p>
      {lastPage > 1 ? (
        <div className="flex gap-2">
          <PageLink href={page > 1 ? auditHref(filters, { page: page - 1 }) : null} label="Previous">
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </PageLink>
          <PageLink href={page < lastPage ? auditHref(filters, { page: page + 1 }) : null} label="Next">
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </PageLink>
        </div>
      ) : null}
    </nav>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  if (!href) {
    return (
      <Button variant="outline" disabled className={buttonClass}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" className={buttonClass}>
      <Link href={href} aria-label={`${label} page`}>
        {children}
      </Link>
    </Button>
  );
}
