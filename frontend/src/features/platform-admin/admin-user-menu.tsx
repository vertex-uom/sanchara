"use client";

import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, LogOut } from "lucide-react";
import { signOutAdmin } from "./auth/actions";
import { ICON_STROKE } from "./sidebar-modes";

export function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const disabledItemClass = "flex min-h-11 items-center rounded-lg px-2 text-sm outline-none data-disabled:text-admin-muted-text";

const itemClass = "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm outline-none data-highlighted:bg-admin-muted";

// Signed-in platform-team member, with sign-out. Account settings come later.
export function AdminUserMenu({ fullName, roleLabel }: { fullName: string; roleLabel: string }) {
  const [signingOut, startSignOut] = useTransition();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-admin-card motion-reduce:transition-none">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-admin-avatar text-base font-semibold text-white">
          {initials(fullName)}
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-medium text-admin-heading">{fullName}</span>
            <ChevronDown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 text-admin-icon" />
          </span>
          <span className="mt-1 inline-block rounded-md bg-admin-muted px-2 py-[3px] text-[11px] leading-none text-admin-body">{roleLabel}</span>
        </span>
        <span className="sr-only lg:hidden">
          {fullName}, {roleLabel}
        </span>
        <span className="sr-only">, account menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-xl border border-admin-border bg-admin-card p-1.5 text-admin-heading shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5">
            <span className="block text-sm font-medium">{fullName}</span>
            <span className="block text-xs text-admin-muted-text">{roleLabel}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-admin-border" />
          <DropdownMenu.Item disabled className={disabledItemClass}>
            Account settings (coming soon)
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={itemClass}
            disabled={signingOut}
            onSelect={(event) => {
              // Keep the menu open while signing out; the redirect replaces the page.
              event.preventDefault();
              startSignOut(() => signOutAdmin());
            }}
          >
            <LogOut aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-icon" />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
