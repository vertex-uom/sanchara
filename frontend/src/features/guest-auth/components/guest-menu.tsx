"use client";

import { useTransition } from "react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut } from "../actions";

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const itemClass =
  "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-brand-tropical outline-none data-highlighted:bg-brand-aqua";

// Signed-in traveller in the central header: account link and sign out.
export function GuestMenu({ fullName, email }: { fullName: string; email: string }) {
  // Called directly: the menu unmounts on select, so a <form> inside it would
  // be gone before it could submit.
  const [signingOut, startSignOut] = useTransition();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring inline-flex min-h-11 items-center gap-2 justify-self-end rounded-full bg-white py-1.5 pr-3 pl-1.5 text-sm font-medium text-brand-tropical shadow transition-colors hover:bg-brand-aqua motion-reduce:transition-none">
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-brand-blaze text-xs font-semibold text-white">
          {initials(fullName)}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{fullName}</span>
        <span className="sr-only sm:hidden">{fullName}</span>
        <ChevronDown aria-hidden="true" className="size-4" />
        <span className="sr-only">, account menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-60 rounded-2xl bg-white p-1.5 shadow-xl">
          <DropdownMenu.Label className="px-2 py-1.5">
            <span className="block text-sm font-semibold text-brand-tropical">{fullName}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-brand-aqua" />
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/account">
              <UserRound aria-hidden="true" className="size-4" />
              My account
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={itemClass}
            disabled={signingOut}
            onSelect={() => startSignOut(() => signOut())}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
