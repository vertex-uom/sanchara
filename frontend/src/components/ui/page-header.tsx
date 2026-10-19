import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  // "Palm Breeze Guest House", "Galle, Sri Lanka"
  place?: { name: string; location: string };
  action?: ReactNode;
};

// Page title with the property line under it and an optional action on the right.
export function PageHeader({ title, place, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
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
      </div>
      {action}
    </header>
  );
}
