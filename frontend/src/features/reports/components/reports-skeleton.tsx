import { Skeleton } from "@/components/ui/widget";
import { KPI_KEYS } from "../config";

// Mirrors the reports layout so the page doesn't jump when content arrives.
export function ReportsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading reports</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="mt-2 h-6 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-11 w-full max-w-lg md:h-9" />
      <Skeleton className="h-48 rounded-xl sm:h-40 xl:h-24" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_KEYS.map((key) => (
          <Skeleton key={key} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-48 rounded-xl xl:h-80" />
      </div>
    </div>
  );
}
