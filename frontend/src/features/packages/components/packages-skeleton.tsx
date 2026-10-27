import { Skeleton } from "@/components/ui/widget";

// Mirrors the packages page layout so it doesn't jump when content arrives.
export function PackagesSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading packages</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48 max-w-full" />
          <Skeleton className="mt-2 h-6 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-[36rem] rounded-xl" />
      </div>
    </div>
  );
}
