import { Skeleton } from "@/components/ui/widget";

// Mirrors the rates page layout so it doesn't jump when content arrives.
export function RatesSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading rates</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="mt-2 h-6 w-56 max-w-full" />
        </div>
        <Skeleton className="h-10 w-72" />
      </div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  );
}
