import { Skeleton } from "@/components/ui/widget";

// Mirrors the availability page header and tabs so it doesn't jump when content arrives.
export function AvailabilitySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading availability</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="mt-2 h-6 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
