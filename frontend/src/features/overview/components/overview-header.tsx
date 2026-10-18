import { Suspense } from "react";
import { connection } from "next/server";
import { colomboHour, formatDate } from "@/lib/format/dates";
import { Skeleton } from "@/components/ui/widget";

export function OverviewHeader({ firstName }: { firstName: string }) {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Overview</h1>
      <Suspense fallback={<Skeleton className="mt-2 h-6 w-72" />}>
        <Greeting firstName={firstName} />
      </Suspense>
    </header>
  );
}

// Greeting and date use the current time in Asia/Colombo.
async function Greeting({ firstName }: { firstName: string }) {
  await connection();
  const now = new Date();
  const hour = colomboHour(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base sm:text-lg">
      <span>
        {greeting}, {firstName}!
      </span>
      <span className="text-muted-foreground">
        Today is <time dateTime={now.toISOString()}>{formatDate(now)}</time>
      </span>
    </p>
  );
}
