import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { PropertySwitcher, type SwitcherProperty } from "./property-switcher";
import { DrawerButton, SidebarFrame } from "./sidebar-frame";
import { UserMenu } from "./user-menu";

type BackofficeShellProps = {
  currentProperty: SwitcherProperty;
  properties: SwitcherProperty[];
  user: { fullName: string; roleLabel: string };
  sidebarFooter: ReactNode;
  children: ReactNode;
};

// App shell for signed-in Back Office pages. Pages render their own <main id="main-content">.
export function BackofficeShell({ currentProperty, properties, user, sidebarFooter, children }: BackofficeShellProps) {
  return (
    <SidebarFrame
      propertyId={currentProperty.id}
      sidebarFooter={sidebarFooter}
      topBar={
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-office-header/90 px-3 py-2 backdrop-blur sm:gap-4 sm:px-6 lg:px-8">
          <DrawerButton />
          <PropertySwitcher current={currentProperty} properties={properties} />
          <SearchPlaceholder />
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              disabled
              aria-label="Notifications (not available yet)"
              title="Notifications are not available yet"
              className="inline-flex size-11 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Bell aria-hidden="true" className="size-6 text-office-icon" />
            </button>
            <UserMenu fullName={user.fullName} roleLabel={user.roleLabel} />
          </div>
        </header>
      }
    >
      {children}
    </SidebarFrame>
  );
}

// Global search is not part of v8; shown disabled to match the design.
function SearchPlaceholder() {
  return (
    <div className="mx-auto hidden w-full max-w-md lg:block">
      <label htmlFor="backoffice-search" className="sr-only">
        Search (not available yet)
      </label>
      <div className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4">
        <Search aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
        <input
          id="backoffice-search"
          type="search"
          disabled
          placeholder="Search reservations, guests…"
          className="w-full min-w-0 cursor-not-allowed bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

// Layout fallback while the shell's data loads.
export function BackofficeShellSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-dvh flex-1">
      <span className="sr-only">Loading Back Office</span>
      <div className="hidden w-20 shrink-0 bg-office-sidebar md:block lg:w-72" />
      <div className="flex-1">
        <div className="h-16 border-b border-border bg-office-header" />
      </div>
    </div>
  );
}
