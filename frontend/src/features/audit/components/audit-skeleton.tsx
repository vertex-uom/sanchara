import { Skeleton } from "@/components/ui/widget";

// Mirrors the audit page layout so it doesn't jump when content arrives.
export function AuditSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading audit trail</span>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-2 h-6 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-9 w-52 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full max-w-4xl md:h-9" />
      <Skeleton className="h-40 rounded-xl xl:h-32" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
