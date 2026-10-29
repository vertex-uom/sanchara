"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { propertyPath } from "@/lib/routes/backoffice";
import { RemoteImage } from "@/components/ui/remote-image";
import { initials } from "@/lib/format/names";

export type SwitcherProperty = { id: string; name: string; location: string; imageUrl: string | null };

function Thumbnail({ property, className }: { property: SwitcherProperty; className: string }) {
  if (property.imageUrl) return <RemoteImage src={property.imageUrl} alt="" className={`${className} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${className} flex items-center justify-center bg-brand-teal font-semibold text-white`}>
      {initials(property.name)}
    </span>
  );
}

// Same section for another property. Record pages (e.g. a reservation) drop
// back to their list, and company pages open the overview. Filters reset,
// since IDs like room types belong to the old property.
function switchHref(pathname: string, currentId: string, targetId: string) {
  const prefix = `${propertyPath(currentId)}/`;
  if (!pathname.startsWith(prefix)) return propertyPath(targetId);
  const segments = pathname.slice(prefix.length).split("/");
  const section = segments.slice(0, segments[0] === "config" ? 2 : 1).join("/");
  return propertyPath(targetId, section);
}

// Company property switcher; choosing a property keeps the current section.
export function PropertySwitcher({ current, properties }: { current: SwitcherProperty; properties: SwitcherProperty[] }) {
  const pathname = usePathname();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-office-nav-active motion-reduce:transition-none">
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
          className="z-50 min-w-64 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-foreground">Properties</DropdownMenu.Label>
          {properties.map((property) => (
            <DropdownMenu.Item key={property.id} asChild>
              <Link
                href={switchHref(pathname, current.id, property.id)}
                aria-current={property.id === current.id ? "page" : undefined}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 outline-none data-highlighted:bg-office-nav-active"
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
