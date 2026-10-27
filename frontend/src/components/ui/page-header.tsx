import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Page title plus a one-line description. The <h1> is the page's main
// heading; pass `actions` for buttons that belong to the page as a whole.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  // Overrides the title's default colour or weight.
  titleClassName?: string;
};

// Page title with the property line (or a description) under it and an optional action on the right.
export function PageHeader({ title, place, description, action, titleClassName }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className={cn("text-3xl font-semibold tracking-tight sm:text-4xl", titleClassName)}>{title}</h1>
        {place ? (
          <p className="mt-1 text-base text-office-muted">
            {place.name}
            <span aria-hidden="true" className="mx-2">
              •
            </span>
            <span className="sr-only">, </span>
            {place.location}
          </p>
        ) : null}
        {description ? <p className="mt-1 text-base text-office-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
