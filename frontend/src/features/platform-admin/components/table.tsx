import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Table styling from the design: muted head row with 8px outer corners,
// 11px Medium muted headers, 12.5px Medium cells, 1px row dividers.
export const TABLE_HEAD_CELL = "px-3 py-2.25 text-left text-[11px] font-medium whitespace-nowrap text-admin-muted-text first:rounded-l-md last:rounded-r-md";
export const TABLE_CELL = "px-3 py-2.75 text-[12.5px] font-medium text-admin-heading";
export const TABLE_ROW = "[&>td]:border-b [&>td]:border-admin-border last:[&>td]:border-b-0";

// Scrolls horizontally inside its card on narrow screens. The wrapper is
// positioned so absolutely placed descendants (sr-only text) stay inside the
// scroll area instead of widening the page.
export function AdminTable({ minWidth, className, ...props }: ComponentProps<"table"> & { minWidth: number }) {
  return (
    <div className="relative overflow-x-auto">
      <table className={cn("w-full border-separate border-spacing-0", className)} style={{ minWidth }} {...props} />
    </div>
  );
}

export function AdminTableEmpty({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted-text">{children}</p>;
}
