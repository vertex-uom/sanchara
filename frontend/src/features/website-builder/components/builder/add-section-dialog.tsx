"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Check, LayoutGrid, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BLOCKS } from "./builder-blocks";
import type { Builder } from "./builder-state";
import { SECTION_LAYOUTS, type SectionType } from "./section-layouts";

const SECTIONS = Object.keys(SECTION_LAYOUTS) as SectionType[];

type AddSectionDialogProps = {
  builder: Builder;
  // Small dashed button under the blocks instead of the large filled one.
  compact?: boolean;
  // Change the layout of an existing section instead of adding one.
  change?: { blockId: string; type: SectionType; layout: string };
  // With `change`: a "Change" text link, or an icon button (block toolbar).
  trigger?: "text" | "icon";
};

// "Add a section": pick a section type on the left and a layout on the
// right. With `change`, it shows that section's layouts and applies one.
export function AddSectionDialog({
  builder,
  compact,
  change,
  trigger = "text",
}: AddSectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SectionType>(change?.type ?? "hero");
  const [layout, setLayout] = useState(
    change?.layout ?? SECTION_LAYOUTS.hero[0].label,
  );
  const types = change ? [change.type] : SECTIONS;

  function chooseType(next: SectionType) {
    setType(next);
    setLayout(SECTION_LAYOUTS[next][0].label);
  }

  function add(chosen = layout) {
    if (change) builder.updateBlock(change.blockId, "layout", chosen);
    else builder.addBlock(type, undefined, { layout: chosen });
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && change) {
          setType(change.type);
          setLayout(change.layout || SECTION_LAYOUTS[change.type][0].label);
        } else if (next) chooseType("hero");
      }}
    >
      {change && trigger === "icon" ? (
        <Dialog.Trigger
          aria-label="Change layout"
          title="Change layout"
          className="focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-office-icon hover:bg-office-chip"
        >
          <LayoutGrid aria-hidden="true" className="size-4" />
        </Dialog.Trigger>
      ) : change ? (
        <Dialog.Trigger className="focus-ring rounded-md text-sm font-semibold text-office-primary hover:underline">
          Change<span className="sr-only"> layout</span>
        </Dialog.Trigger>
      ) : (
        <Dialog.Trigger
          className={cn(
            "focus-ring inline-flex items-center gap-2 rounded-lg font-semibold",
            compact
              ? "h-9 border border-dashed border-office-primary/60 bg-card px-4 text-sm text-office-primary hover:bg-office-tint-teal"
              : "h-11 bg-office-primary px-5 text-sm text-white hover:bg-office-primary/90",
          )}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add section
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0b2240]/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(90dvh,44rem)] w-[min(94vw,56rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-office-meter-track px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-semibold text-office-icon">
                {change
                  ? `Change ${BLOCKS[change.type].label.toLowerCase()} layout`
                  : "Add a section"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-office-muted">
                Choose a layout. You can change the content and style anytime.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="focus-ring inline-flex size-9 items-center justify-center rounded-lg border border-office-meter-track text-office-icon hover:bg-office-chip"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <nav
              aria-label="Section types"
              className="shrink-0 overflow-x-auto border-b border-office-meter-track p-3 sm:w-52 sm:overflow-y-auto sm:border-r sm:border-b-0"
            >
              <ul className="flex gap-1 sm:flex-col">
                {types.map((section) => {
                  const active = section === type;
                  return (
                    <li key={section}>
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={() => chooseType(section)}
                        className={cn(
                          "focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap",
                          active
                            ? "bg-office-tint-teal font-semibold text-office-primary"
                            : "text-office-icon hover:bg-office-chip",
                        )}
                      >
                        {BLOCKS[section].label}
                        <span
                          className={cn(
                            "text-xs",
                            active
                              ? "text-office-primary"
                              : "text-office-muted",
                          )}
                        >
                          {SECTION_LAYOUTS[section].length}
                          <span className="sr-only"> layouts</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <fieldset className="min-h-0 flex-1 overflow-y-auto bg-[#fafcfd] p-4 sm:p-5">
              <legend className="sr-only">{BLOCKS[type].label} layouts</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {SECTION_LAYOUTS[type].map((option) => {
                  const selected = option.label === layout;
                  return (
                    <label
                      key={option.label}
                      onDoubleClick={() => add(option.label)}
                      className={cn(
                        "cursor-pointer rounded-xl border-[1.5px] bg-card p-2.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                        selected
                          ? "border-brand-cyan bg-[#f4fbfc]"
                          : "border-office-meter-track hover:border-brand-cyan/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="section-layout"
                        value={option.label}
                        checked={selected}
                        onChange={() => setLayout(option.label)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="block aspect-16/9 overflow-hidden rounded-lg"
                      >
                        {option.thumb}
                      </span>
                      <span className="mt-2.5 flex items-end justify-between gap-2 px-0.5">
                        <span>
                          <span className="block text-sm font-semibold text-office-icon">
                            {option.label}
                          </span>
                          <span className="block text-xs text-office-muted">
                            {option.description}
                          </span>
                        </span>
                        {selected ? (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-office-primary text-white">
                            <Check
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={3}
                            />
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-office-meter-track px-6 py-4">
            <p role="status" className="text-sm text-office-muted">
              Selected: {BLOCKS[type].label} · {layout}
            </p>
            <div className="flex gap-2.5">
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-office-meter-track bg-card px-6 font-semibold text-office-icon hover:bg-office-chip"
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                variant="office"
                onClick={() => add()}
                className="h-11 gap-2 px-6 font-semibold"
              >
                {change ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                {change ? "Use this layout" : "Add section"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
