"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, NavKey } from "./central-header";

const itemClass =
  "flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-brand-tropical outline-none data-highlighted:bg-brand-aqua";

// Below md the central header's nav links don't fit beside the logo and
// account action, so they collapse into this menu.
export function MobileNav({ items, active }: { items: NavItem[]; active?: NavKey }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex size-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 transition-colors hover:bg-white/30 motion-reduce:transition-none md:hidden">
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">Main menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-48 rounded-2xl bg-white p-1.5 shadow-xl">
          {items.map((item) =>
            item.href ? (
              <DropdownMenu.Item key={item.key} asChild className={cn(itemClass, "cursor-pointer")}>
                <Link
                  href={item.href}
                  aria-current={item.key === active ? "page" : undefined}
                  className="aria-[current=page]:font-semibold"
                >
                  {item.label}
                </Link>
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item key={item.key} disabled className={cn(itemClass, "text-muted-foreground")}>
                {item.label} (coming soon)
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
