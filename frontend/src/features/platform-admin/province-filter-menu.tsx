"use client";

import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronDown, Loader2, Map as MapIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { setProvinceFilter } from "./province-filter-actions";
import { ICON_STROKE } from "./sidebar-modes";

type Option = { id: number; label: string; companies: number };

const ALL = "all";

const companies = (count: number) => `${count} ${count === 1 ? "company" : "companies"}`;

const itemClass =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm outline-none data-highlighted:bg-admin-muted data-[state=checked]:font-medium sm:min-h-9";

// Header filter: the whole country or one province. The choice narrows the
// Platform Overview figures and is remembered across tabs.
export function ProvinceFilterMenu({ options, selectedId }: { options: Option[]; selectedId: number | null }) {
  const [pending, startTransition] = useTransition();
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const label = selected?.label ?? "All of Sri Lanka";
  const summary = selected ? `${companies(selected.companies)} · Overview filtered` : `${options.length} provinces`;

  const choose = (value: string) => {
    const id = value === ALL ? null : Number(value);
    if (id === (selected?.id ?? null)) return;
    startTransition(() => setProvinceFilter(id));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-xl pr-1 text-left transition-colors hover:bg-admin-card motion-reduce:transition-none">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-[10px]", selected ? "bg-admin-primary text-white" : "bg-admin-primary-soft text-admin-primary")}>
          {pending ? (
            <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          ) : selected ? (
            <MapPin aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6" />
          ) : (
            <MapIcon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6" />
          )}
        </span>
        <span className="hidden lg:block">
          <span className="flex items-center gap-1">
            <span className="text-sm font-medium text-admin-heading">{label}</span>
            <ChevronDown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-icon" />
          </span>
          <span className="block text-[11px] text-admin-muted-text">{summary}</span>
        </span>
        <span className="sr-only lg:hidden">{label}</span>
        <span className="sr-only">, province filter</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={6} className="z-50 max-h-[70dvh] min-w-64 overflow-y-auto rounded-xl border border-admin-border bg-admin-card p-1.5 text-admin-heading shadow-lg">
          <DropdownMenu.Label className="px-2 pt-1.5 pb-1 text-[11px] font-medium text-admin-muted-text">Show figures for</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={selected ? String(selected.id) : ALL} onValueChange={choose}>
            <DropdownMenu.RadioItem value={ALL} className={itemClass}>
              <MapIcon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 text-admin-icon" />
              <span className="flex-1">All of Sri Lanka</span>
              <DropdownMenu.ItemIndicator>
                <Check aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-primary" />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
            <DropdownMenu.Separator className="my-1 h-px bg-admin-border" />
            {options.map((option) => (
              <DropdownMenu.RadioItem key={option.id} value={String(option.id)} className={itemClass}>
                <MapPin aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 text-admin-icon" />
                <span className="flex-1">{option.label}</span>
                <span className="text-[11px] text-admin-muted-text tabular-nums">{option.companies}</span>
                <span className="w-4">
                  <DropdownMenu.ItemIndicator>
                    <Check aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-primary" />
                  </DropdownMenu.ItemIndicator>
                </span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <p className="px-2 pt-1.5 pb-1 text-[10.5px] text-admin-muted-text">Numbers are companies with a property in the province.</p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
