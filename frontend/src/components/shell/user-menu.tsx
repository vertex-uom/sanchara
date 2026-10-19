"use client";

import { DropdownMenu } from "radix-ui";
import { ChevronDown } from "lucide-react";

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const disabledItemClass = "flex min-h-11 items-center rounded-lg px-2 text-sm outline-none data-disabled:text-muted-foreground";

// Signed-in staff member. Account and sign-out actions arrive with sessions.
export function UserMenu({ fullName, roleLabel }: { fullName: string; roleLabel: string }) {
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
          <DropdownMenu.Item disabled className={disabledItemClass}>
            Account settings (coming soon)
          </DropdownMenu.Item>
          <DropdownMenu.Item disabled className={disabledItemClass}>
            Sign out (coming soon)
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
