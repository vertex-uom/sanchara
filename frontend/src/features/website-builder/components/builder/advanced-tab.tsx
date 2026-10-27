"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronDown, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { inputClass, Switch } from "../template-fields";
import { isSection, type BuilderBlock } from "./builder-blocks";
import type { Builder } from "./builder-state";
import { scheduleState } from "./section-style";

type AdvancedTabProps = {
  builder: Builder;
  block: BuilderBlock;
  // Free web address, for the anchor link.
  address: string;
};

// Advanced tab: anchor link, schedule, screen reader label, custom class,
// lock and delete.
export function AdvancedTab({ builder, block, address }: AdvancedTabProps) {
  const p = block.props;
  const set = (key: string, value: string) =>
    builder.updateBlock(block.id, key, value);
  const kind = isSection(block.type) ? "section" : "block";
  const id = (name: string) => `advanced-${block.id}-${name}`;
  const [copied, setCopied] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const schedule = scheduleState(block);
  const link = `${address}${builder.page.path === "/" ? "/" : `${builder.page.path}`}#${p.anchor || block.type}`;
  const datesWrong = Boolean(
    p.scheduleStart && p.scheduleEnd && p.scheduleEnd < p.scheduleStart,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          htmlFor={id("anchor")}
          className="mb-2 block text-sm font-semibold text-office-icon"
        >
          Section ID (anchor link)
        </label>
        <div className="flex h-11 items-center gap-1 rounded-lg border border-office-meter-track bg-card pr-1 pl-3.5 has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
          <span aria-hidden="true" className="text-sm text-office-muted">
            #
          </span>
          <input
            id={id("anchor")}
            value={p.anchor ?? ""}
            maxLength={40}
            placeholder={block.type}
            aria-describedby={id("anchor-link")}
            onChange={(event) =>
              set(
                "anchor",
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-/, ""),
              )
            }
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-office-muted/70"
          />
          <button
            type="button"
            aria-label={copied ? "Link copied" : "Copy link to this section"}
            title="Copy link"
            onClick={copyLink}
            className="focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-office-chip hover:text-office-icon"
          >
            {copied ? (
              <Check
                aria-hidden="true"
                className="size-4 text-office-primary"
              />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        <p
          id={id("anchor-link")}
          className="mt-1.5 truncate text-xs text-office-muted"
          title={link}
        >
          Link to this {kind}: {link}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Schedule
        </legend>
        <SwitchRow
          id={id("scheduled")}
          label="Show only between dates"
          description="Great for seasonal offers"
          checked={p.scheduled === "true"}
          onChange={(on) => {
            set("scheduled", on ? "true" : "");
            setDatesOpen(on && !p.scheduleStart && !p.scheduleEnd);
          }}
        />
        {p.scheduled === "true" ? (
          <div className="mt-3">
            <button
              type="button"
              aria-expanded={datesOpen}
              aria-controls={id("dates")}
              onClick={() => setDatesOpen((open) => !open)}
              className="focus-ring flex h-11 w-full items-center gap-2.5 rounded-lg border border-office-meter-track bg-card px-3.5 text-left text-sm text-office-icon hover:bg-office-chip/50"
            >
              <CalendarDays
                aria-hidden="true"
                className="size-4 shrink-0 text-office-primary"
              />
              <span className="flex-1 truncate">
                {schedule.label || "Choose dates"}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 transition-transform",
                  datesOpen && "rotate-180",
                )}
              />
            </button>
            {datesOpen ? (
              <div
                id={id("dates")}
                className="mt-2 grid grid-cols-2 gap-2.5 rounded-lg border border-office-meter-track p-3"
              >
                <div>
                  <label
                    htmlFor={id("start")}
                    className="mb-1 block text-xs font-medium text-office-muted"
                  >
                    From
                  </label>
                  <input
                    id={id("start")}
                    type="date"
                    value={p.scheduleStart ?? ""}
                    onChange={(event) =>
                      set("scheduleStart", event.target.value)
                    }
                    className={cn(inputClass, "h-10 px-2.5 text-xs")}
                  />
                </div>
                <div>
                  <label
                    htmlFor={id("end")}
                    className="mb-1 block text-xs font-medium text-office-muted"
                  >
                    Until
                  </label>
                  <input
                    id={id("end")}
                    type="date"
                    min={p.scheduleStart || undefined}
                    value={p.scheduleEnd ?? ""}
                    onChange={(event) => set("scheduleEnd", event.target.value)}
                    className={cn(inputClass, "h-10 px-2.5 text-xs")}
                  />
                </div>
              </div>
            ) : null}
            <p
              role={datesWrong ? "alert" : "status"}
              className={cn(
                "mt-1.5 text-xs",
                datesWrong
                  ? "font-medium text-office-danger-text"
                  : "text-office-muted",
              )}
            >
              {datesWrong
                ? "The end date is before the start date."
                : schedule.label
                  ? schedule.active
                    ? "Showing now."
                    : "Not showing today; guests see it between these dates."
                  : "Leave a date empty to keep that end open."}
            </p>
          </div>
        ) : null}
      </fieldset>

      <div>
        <label
          htmlFor={id("aria")}
          className="mb-2 block text-sm font-semibold text-office-icon"
        >
          Accessibility
        </label>
        <input
          id={id("aria")}
          maxLength={80}
          value={p.ariaLabel ?? ""}
          placeholder={
            kind === "section"
              ? "e.g. Welcome banner with booking"
              : "Short description"
          }
          aria-describedby={id("aria-hint")}
          onChange={(event) => set("ariaLabel", event.target.value)}
          className={inputClass}
        />
        <p id={id("aria-hint")} className="mt-1.5 text-xs text-office-muted">
          Describes this {kind} for screen readers.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <label
            htmlFor={id("class")}
            className="text-sm font-semibold text-office-icon"
          >
            Custom CSS class
          </label>
          <span className="text-xs text-office-muted">Optional</span>
        </div>
        <input
          id={id("class")}
          maxLength={60}
          value={p.cssClass ?? ""}
          placeholder="e.g. hero-seasonal"
          aria-describedby={id("class-hint")}
          onChange={(event) =>
            set(
              "cssClass",
              event.target.value.replace(/[^A-Za-z0-9_\- ]+/g, ""),
            )
          }
          className={inputClass}
        />
        <p id={id("class-hint")} className="mt-1.5 text-xs text-office-muted">
          For styles your developer adds to the live site.
        </p>
      </div>

      <SwitchRow
        id={id("locked")}
        label={`Lock ${kind}`}
        description="Prevent accidental edits"
        checked={p.locked === "true"}
        onChange={(on) => set("locked", on ? "true" : "")}
      />

      <div className="border-t border-office-meter-track pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={p.locked === "true"}
          aria-describedby={
            p.locked === "true" ? id("delete-locked") : undefined
          }
          onClick={() => builder.deleteBlock(block.id)}
          className="h-11 w-full gap-2 border-office-danger/30 bg-office-danger-soft font-semibold text-office-danger-text hover:bg-office-danger-soft/70"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete {kind}
        </Button>
        {p.locked === "true" ? (
          <p
            id={id("delete-locked")}
            className="mt-1.5 text-center text-xs text-office-muted"
          >
            Unlock the {kind} to delete it.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>
        <span id={`${id}-label`} className="block text-sm text-office-icon">
          {label}
        </span>
        <span
          id={`${id}-description`}
          className="block text-xs text-office-muted"
        >
          {description}
        </span>
      </span>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}
