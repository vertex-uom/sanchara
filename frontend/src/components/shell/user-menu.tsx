"use client";

import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowLeftRight, ChevronDown, LogOut } from "lucide-react";
import { signOutStaffAction, switchStaffViewAction } from "@/lib/auth/actions";
import { STAFF_ROLE_LABELS, viewableRoles, type StaffRole } from "@/lib/auth/staff";
import { initials } from "@/lib/format/names";

const itemClass =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm outline-none data-highlighted:bg-office-nav-active data-disabled:cursor-default data-disabled:text-muted-foreground";

type UserMenuProps = { fullName: string; role: StaffRole; roleLabel: string; accountRole: StaffRole; propertyId: string };

// Signed-in staff member: role view switch and sign-out. Account settings come later.
export function UserMenu({ fullName, role, roleLabel, accountRole, propertyId }: UserMenuProps) {
  const [switching, startSwitch] = useTransition();
  const [signingOut, startSignOut] = useTransition();
  // TEMPORARY dev switch: the account's own role or any role below it (see lib/auth/staff.ts).
  const switchTargets = viewableRoles(accountRole).filter((target) => target !== role);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex min-h-11 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-office-nav-active motion-reduce:transition-none">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-avatar text-sm font-semibold text-white sm:size-12 sm:text-base">
          {initials(fullName)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium">{fullName}</span>
          <span className="mt-0.5 inline-block rounded-md bg-office-pill px-2 py-0.5 text-xs">{roleLabel}</span>
        </span>
        <span className="sr-only sm:hidden">
          {fullName}, {roleLabel}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        <span className="sr-only">, account menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5">
            <span className="block text-sm font-medium">{fullName}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {switchTargets.map((target) => (
            <DropdownMenu.Item
              key={target}
              disabled={switching}
              onSelect={() => startSwitch(() => switchStaffViewAction(target, propertyId))}
              className={itemClass}
            >
              <ArrowLeftRight aria-hidden="true" className="size-4 text-office-icon" />
              Switch to {STAFF_ROLE_LABELS[target]} view
            </DropdownMenu.Item>
          ))}
          {switchTargets.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-border" />}
          <DropdownMenu.Item disabled className={itemClass}>
            Account settings (coming soon)
          </DropdownMenu.Item>
          <DropdownMenu.Item disabled={signingOut} onSelect={() => startSignOut(() => signOutStaffAction())} className={itemClass}>
            <LogOut aria-hidden="true" className="size-4 text-office-icon" />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
