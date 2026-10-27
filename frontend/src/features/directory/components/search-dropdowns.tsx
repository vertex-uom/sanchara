"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Popover, Select } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchControlClass } from "./search-field";

// Floating panels for the search-bar fields on the home page and /properties.
// Only the panels are custom; the closed fields keep the search-bar styling.

// Opens below the field, flips above when there is no room, and animates from
// the side it opens on. Rendered in a portal so no parent can clip it.
const panelClass = cn(
  "z-50 overflow-hidden rounded-2xl border border-brand-lagoon/60 bg-white p-1.5 text-brand-tropical shadow-[0_18px_40px_-12px_rgb(0_0_0/0.25)]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:animate-none",
);

const optionClass =
  "flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm outline-none transition-colors select-none motion-reduce:transition-none";
const highlightedClass = "bg-brand-aqua";
const selectedClass = "font-semibold text-brand-teal";

// Thin teal scrollbar for long lists.
const scrollClass =
  "overflow-y-auto overscroll-contain [scrollbar-color:var(--color-brand-teal)_transparent] [scrollbar-width:thin]";

// Panel spacing and edge padding, shared by both dropdowns.
const popperProps = { sideOffset: 14, align: "start", collisionPadding: 16 } as const;

// Radix items cannot use "" as a value, so "any" maps to this internally.
const ANY = "__any";

export type SearchOption = { value: string; label: string };

type SearchSelectProps = {
  id: string;
  name: string;
  // Label of the "no restriction" option, e.g. "Any type". Its value is "".
  anyLabel: string;
  options: SearchOption[];
  // Controlled when value is passed; otherwise starts from defaultValue.
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

// Single-choice dropdown. The value is posted through a hidden input, so the
// surrounding GET form works as before.
export function SearchSelect({ id, name, anyLabel, options, value, defaultValue = "", onValueChange }: SearchSelectProps) {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const current = value ?? ownValue;

  function change(next: string) {
    const real = next === ANY ? "" : next;
    setOwnValue(real);
    onValueChange?.(real);
  }

  return (
    <>
      <Select.Root value={current || ANY} onValueChange={change}>
        <Select.Trigger
          id={id}
          className={cn(searchControlClass, "flex cursor-pointer items-center justify-between gap-2 text-left")}
        >
          <span className="truncate">
            <Select.Value />
          </span>
          <Select.Icon asChild>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-brand-tropical" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            {...popperProps}
            className={cn(
              panelClass,
              "w-[max(var(--radix-select-trigger-width),13rem)] max-h-[min(20rem,var(--radix-select-content-available-height))]",
            )}
          >
            <Select.Viewport className="space-y-0.5">
              {[{ value: ANY, label: anyLabel }, ...options].map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    optionClass,
                    "data-highlighted:bg-brand-aqua data-[state=checked]:font-semibold data-[state=checked]:text-brand-teal",
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check aria-hidden="true" className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <input type="hidden" name={name} value={current} />
    </>
  );
}

type LocationComboboxProps = {
  id: string;
  name: string;
  placeholder: string;
  options: readonly string[];
  // Controlled when value is passed; otherwise uncontrolled.
  value?: string;
  onValueChange?: (value: string) => void;
};

// Searchable location field. Typing filters the list (case-insensitive,
// partial); typing an option in full selects it in its listed spelling.
// Picking an option fills the field. Enter with no option highlighted submits
// the form as before.
export function LocationCombobox({ id, name, placeholder, options, value, onValueChange }: LocationComboboxProps) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [ownValue, setOwnValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const current = value ?? ownValue;

  // Show every option until the text narrows the list, and the full list again
  // when the field holds a picked option.
  const needle = current.trim().toLowerCase();
  const exact = options.some((option) => option.toLowerCase() === needle);
  const matches = needle && !exact ? options.filter((option) => option.toLowerCase().includes(needle)) : options;
  // Opens only once something is typed, not when the field is focused.
  const showing = open && needle !== "";

  function change(next: string) {
    setOwnValue(next);
    onValueChange?.(next);
  }

  function type(text: string) {
    const exactOption = options.find((option) => option.toLowerCase() === text.trim().toLowerCase());
    change(exactOption ?? text);
    setOpen(!exactOption);
    setActive(-1);
  }

  function pick(option: string) {
    change(option);
    setOpen(false);
    setActive(-1);
  }

  function move(next: number) {
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!showing) {
        setOpen(true);
        return;
      }
      if (matches.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      move((active + step + matches.length) % matches.length);
    } else if (event.key === "Enter" && showing && active >= 0) {
      event.preventDefault();
      pick(matches[active]);
    } else if (event.key === "Escape" && showing) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <Popover.Root open={showing} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showing}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
          value={current}
          onChange={(event) => type(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={searchControlClass}
        />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          {...popperProps}
          // Keep typing in the field: no focus move, and clicks on it don't close.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target instanceof Node && document.getElementById(id)?.contains(event.target)) event.preventDefault();
          }}
          className={cn(panelClass, "w-[max(var(--radix-popover-trigger-width),14rem)]")}
        >
          {matches.length === 0 ? (
            <p role="status" className="px-3 py-2.5 text-sm text-muted-foreground">
              No districts found
            </p>
          ) : null}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Locations"
            className={cn(scrollClass, "max-h-[min(18rem,calc(var(--radix-popover-content-available-height)-1rem))] space-y-0.5 pr-0.5")}
          >
            {matches.map((option, index) => {
              const selected = option.toLowerCase() === needle;
              return (
                <li
                  key={option}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActive(index)}
                  onClick={() => pick(option)}
                  className={cn(optionClass, index === active && highlightedClass, selected && selectedClass)}
                >
                  {option}
                  {selected ? <Check aria-hidden="true" className="size-4" /> : null}
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
