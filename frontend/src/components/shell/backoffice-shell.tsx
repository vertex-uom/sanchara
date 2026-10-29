import type { ReactNode } from "react";
import { BackofficeNotifications } from "@/features/notifications";
import { GlobalSearch } from "@/features/search";
import type { StaffUser } from "@/lib/auth/staff";
import { PropertySwitcher, type SwitcherProperty } from "./property-switcher";
import { DrawerButton, SidebarFrame } from "./sidebar-frame";
import { UserMenu } from "./user-menu";

type BackofficeShellProps = {
  currentProperty: SwitcherProperty;
  properties: SwitcherProperty[];
  user: Pick<StaffUser, "fullName" | "role" | "roleLabel" | "accountRole">;
  sidebarFooter: ReactNode;
  children: ReactNode;
};

// App shell for signed-in Back Office pages. Pages render their own <main id="main-content">.
export function BackofficeShell({ currentProperty, properties, user, sidebarFooter, children }: BackofficeShellProps) {
  return (
    <SidebarFrame
      propertyId={currentProperty.id}
      role={user.role}
      sidebarFooter={sidebarFooter}
      topBar={
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-office-header/90 px-3 py-2 backdrop-blur sm:gap-4 sm:px-6 lg:px-8 print:hidden">
          <DrawerButton />
          <PropertySwitcher current={currentProperty} properties={properties} />
          <GlobalSearch key={currentProperty.id} propertyId={currentProperty.id} />
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            {/* Company-wide, so it stays mounted when the property changes. */}
            <BackofficeNotifications />
            <UserMenu
              fullName={user.fullName}
              role={user.role}
              roleLabel={user.roleLabel}
              accountRole={user.accountRole}
              propertyId={currentProperty.id}
            />
          </div>
        </header>
      }
    >
      {children}
    </SidebarFrame>
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
