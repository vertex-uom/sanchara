import { Skeleton } from "@/components/ui/widget";

// Mirrors the settings page layout so it doesn't jump when content arrives.
export function SettingsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading property settings</span>
      <div>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="mt-2 h-6 w-64 max-w-full" />
      </div>
      <Skeleton className="h-11 w-full max-w-3xl md:h-9" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
