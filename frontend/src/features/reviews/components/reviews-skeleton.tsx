import { Skeleton } from "@/components/ui/widget";

// Mirrors the Reviews header and summary cards so nothing jumps.
export function ReviewsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading reviews</span>
      <div>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-2 h-6 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-[12px]" />
        <Skeleton className="h-36 rounded-[12px] lg:col-span-2" />
      </div>
    </div>
  );
}
