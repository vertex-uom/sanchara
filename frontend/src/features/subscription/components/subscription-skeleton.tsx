import { Skeleton } from "@/components/ui/widget";

// Mirrors the subscription page layout so it doesn't jump when content arrives.
export function SubscriptionSkeleton() {
  return (
    <div aria-busy="true" className="flex min-w-0 flex-1 flex-col gap-4">
      <span className="sr-only">Loading subscription</span>
      <div>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="mt-2 h-6 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
