import { Skeleton } from "@/components/ui/widget";

// Mirrors the staff page layout so it doesn't jump when content arrives.
export function StaffSkeleton() {
  return (
    <div aria-busy="true" className="flex min-w-0 flex-1 flex-col gap-4">
      <span className="sr-only">Loading staff</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="mt-2 h-6 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="flex flex-wrap justify-between gap-3">
        <Skeleton className="h-11 w-full max-w-md md:h-9" />
        <Skeleton className="h-11 w-full sm:w-60 md:h-10" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
