import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared building blocks for Back Office dashboard widgets.

export function WidgetCard({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5", className)} {...props} />;
}

export function WidgetHeader({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-lg font-semibold sm:text-xl">
        {title}
      </h2>
      {action}
    </div>
  );
}

// "View all →" style link. srContext names the target for screen readers.
export function WidgetLink({
  href,
  children,
  srContext,
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  srContext?: string;
  className?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-office-link underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      {srContext ? <span className="sr-only"> {srContext}</span> : null}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-office-meter-track motion-reduce:animate-none", className)} />;
}

// Fallback for a whole widget while its data loads.
export function WidgetSkeleton({ title, className }: { title: string; className?: string }) {
  return (
    <WidgetCard aria-busy="true" aria-label={`${title} (loading)`} className={className}>
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </WidgetCard>
  );
}
