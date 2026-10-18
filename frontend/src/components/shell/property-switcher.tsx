"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { propertyPath } from "@/lib/routes/backoffice";
import { RemoteImage } from "@/components/ui/remote-image";

export type SwitcherProperty = { id: string; name: string; location: string; imageUrl: string | null };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function Thumbnail({ property, className }: { property: SwitcherProperty; className: string }) {
  if (property.imageUrl) return <RemoteImage src={property.imageUrl} alt="" className={`${className} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${className} flex items-center justify-center bg-brand-teal font-semibold text-white`}>
      {initials(property.name)}
    </span>
  );
}

// Company property switcher; choosing a property opens its overview.
export function PropertySwitcher({ current, properties }: { current: SwitcherProperty; properties: SwitcherProperty[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-brand-aqua/60 motion-reduce:transition-none">
        <Thumbnail property={current} className="size-10 shrink-0 rounded-lg text-sm sm:size-12" />
        <span className="min-w-0">
          <span className="sr-only">Current property: </span>
          <span className="block truncate text-sm font-medium sm:text-base">{current.name}</span>
          <span className="hidden truncate text-xs text-muted-foreground sm:block">{current.location}</span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        <span className="sr-only">, switch property</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-64 rounded-xl border border-brand-lagoon/50 bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-foreground">Properties</DropdownMenu.Label>
          {properties.map((property) => (
            <DropdownMenu.Item key={property.id} asChild>
              <Link
                href={propertyPath(property.id)}
                aria-current={property.id === current.id ? "page" : undefined}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 outline-none data-highlighted:bg-brand-aqua"
              >
                <Thumbnail property={property} className="size-8 shrink-0 rounded-md text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{property.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{property.location}</span>
                </span>
                {property.id === current.id ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
