import { Skeleton } from "@/components/ui/widget";

// Mirrors the Rooms & Units header, stat cards and toolbar so nothing jumps.
export function RoomsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading rooms and units</span>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-56 max-w-full" />
          <Skeleton className="mt-2 h-6 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-[12px]" />
        <Skeleton className="h-20 rounded-[12px]" />
        <Skeleton className="h-20 rounded-[12px]" />
      </div>
      <Skeleton className="h-10 rounded-lg" />
    </div>
  );
}
