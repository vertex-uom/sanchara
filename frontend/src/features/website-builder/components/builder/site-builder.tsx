"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BookingEngineStatus } from "@/features/website";
import type { Palette as PaletteColors } from "../brand-colors-form";
import { siteAddress } from "../preview-site";
import { SCRATCH_PATH, SCRATCH_STEPS, type FontStyle } from "../scratch-steps";
import { DRAFT_KEYS, useSavedDraft } from "../template-draft";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { BlocksPanel } from "./blocks-panel";
import { BuilderCanvas } from "./builder-canvas";
import { STYLES_SELECTION, useBuilder } from "./builder-state";
import { canvasLook, defaultStyles } from "./site-styles";
import { NO_BLOCK_IMAGES, SettingsPanel } from "./settings-panel";
import { AddPageDialog } from "./add-page-dialog";

// Index of "Build page" in SCRATCH_STEPS.
const STEP = 2;

type ScratchBasics = {
  name: string;
  tagline: string;
  colors: PaletteColors;
  font: FontStyle;
};

// "Start from scratch", step 3: the drag-and-drop page builder.
type SiteBuilderProps = {
  hotelName: string;
  // For the "Booking engine connected" check.
  bookingEngine: BookingEngineStatus;
};

export function SiteBuilder({ hotelName, bookingEngine }: SiteBuilderProps) {
  const basics = useSavedDraft<ScratchBasics>(DRAFT_KEYS.scratch);
  const name = basics?.name?.trim() || hotelName;
  const [logo] = useTemplateFiles<File | null>(FILE_KEYS.scratchLogo, null);
  const [images] = useTemplateFiles(
    FILE_KEYS.scratchBlockImages,
    NO_BLOCK_IMAGES,
  );
  const builder = useBuilder({ name, tagline: basics?.tagline ?? "" });
  const [previewing, setPreviewing] = useState(false);
  // Applied Site Styles (or Site basics), with any unapplied changes on top.
  const savedStyles = builder.site.styles ?? defaultStyles(basics);
  const styles = builder.styleDraft ?? savedStyles;
  const { backgrounds, style } = canvasLook(styles, builder.page.background);

  // Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes, outside text fields.
  const { undo, redo } = builder;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div className="flex h-dvh flex-col bg-[#f4f9fb]">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-office-meter-track bg-white px-4 py-2.5 lg:flex-nowrap">
        <Link
          href={SCRATCH_PATH}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-office-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to setup
        </Link>
        <span
          aria-hidden="true"
          className="hidden h-7 w-px bg-office-meter-track sm:block"
        />
        <PageMenu builder={builder} />
        <StepProgress />

        <div className="ml-auto flex items-center gap-1.5">
          <ToolbarButton
            label="Undo"
            disabled={!builder.canUndo}
            onClick={builder.undo}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!builder.canRedo}
            onClick={builder.redo}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
          <Button
            type="button"
            variant="outline"
            aria-pressed={builder.stylesOpen}
            onClick={() =>
              builder.select(builder.stylesOpen ? null : STYLES_SELECTION)
            }
            className={cn(
              "h-10 gap-2 border-office-meter-track bg-card px-3.5 font-semibold text-office-icon hover:bg-office-chip",
              builder.stylesOpen && "border-brand-cyan bg-office-tint-teal",
            )}
          >
            <Palette aria-hidden="true" className="size-4" />
            Styles
          </Button>
          <span
            role="status"
            className="hidden px-2 text-xs text-office-muted xl:inline"
          >
            {builder.saved ? "All changes saved" : "No changes yet"}
          </span>
          <Button
            type="button"
            variant="outline"
            aria-pressed={previewing}
            onClick={() => {
              setPreviewing((on) => !on);
              builder.select(null);
            }}
            className="h-10 gap-2 border-office-meter-track bg-card px-4 font-semibold text-office-icon hover:bg-office-chip"
          >
            {previewing ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
            {previewing ? "Exit preview" : "Preview"}
          </Button>
          <Button asChild variant="office" className="h-10 px-4 font-semibold">
            <Link href={`${SCRATCH_PATH}/review`}>Review &amp; publish</Link>
          </Button>
        </div>
      </header>

      <p className="flex items-center gap-2 border-b border-office-meter-track bg-office-tint-teal px-4 py-2 text-xs text-office-primary lg:hidden">
        <Monitor aria-hidden="true" className="size-4 shrink-0" />
        The builder works best on a larger screen. Widen the window to add and
        edit blocks.
      </p>

      <div className="flex min-h-0 flex-1">
        {previewing ? null : (
          <aside
            aria-label="Blocks"
            className="hidden w-72 shrink-0 overflow-y-auto border-r border-office-meter-track bg-white lg:block"
          >
            <BlocksPanel builder={builder} />
          </aside>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Page canvas"
          className="min-w-0 flex-1 overflow-y-auto px-4 py-6 outline-none sm:px-8"
        >
          <BuilderCanvas
            builder={builder}
            name={name}
            tagline={basics?.tagline ?? ""}
            logo={logo}
            style={style}
            backgrounds={backgrounds}
            images={images}
            previewing={previewing}
          />
        </main>
        {previewing ? null : (
          <aside
            aria-label="Settings"
            className="hidden w-80 shrink-0 overflow-y-auto border-l border-office-meter-track bg-white lg:block"
          >
            <SettingsPanel
              builder={builder}
              address={siteAddress(name)}
              backgrounds={backgrounds}
              savedStyles={savedStyles}
              images={images}
              bookingEngine={bookingEngine}
              onPreview={() => {
                setPreviewing(true);
                builder.select(null);
              }}
              reviewHref={`${SCRATCH_PATH}/review`}
            />
          </aside>
        )}
        <AddPageDialog builder={builder} address={siteAddress(name)} />
      </div>
    </div>
  );
}

function PageMenu({ builder }: { builder: ReturnType<typeof useBuilder> }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3 text-sm text-office-icon hover:bg-office-chip">
        <span className="text-office-muted">Page:</span>
        <span className="max-w-32 truncate font-semibold">
          {builder.page.name}
        </span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs text-office-muted">
            Pages
          </DropdownMenu.Label>
          {builder.site.pages.map((page) => (
            <DropdownMenu.Item
              key={page.id}
              onSelect={() => builder.goToPage(page.id)}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-office-icon outline-none data-highlighted:bg-office-nav-active"
            >
              <span className="flex-1">
                {page.name}{" "}
                <span className="text-xs text-office-muted">{page.path}</span>
              </span>
              {page.id === builder.page.id ? (
                <Check aria-hidden="true" className="size-4" />
              ) : null}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => builder.setAddingPage(true)}
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-semibold text-office-primary outline-none data-highlighted:bg-office-nav-active"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add page
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// "STEP 3 OF 5 · Build page" with one bar per step.
function StepProgress() {
  return (
    <div className="hidden items-center gap-4 rounded-xl border border-office-meter-track bg-card px-3.5 py-1.5 md:flex">
      <div>
        <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-office-primary uppercase">
          Step {STEP + 1} of {SCRATCH_STEPS.length}
        </p>
        <div aria-hidden="true" className="mt-1 flex gap-1">
          {SCRATCH_STEPS.map((step, index) => (
            <span
              key={step.label}
              className={cn(
                "h-1 w-6 rounded-full",
                index < STEP && "bg-office-primary",
                index === STEP && "bg-office-chart-bright",
                index > STEP && "bg-office-meter-track",
              )}
            />
          ))}
        </div>
      </div>
      <span className="text-sm font-semibold text-office-icon">
        {SCRATCH_STEPS[STEP].label}
      </span>
    </div>
  );
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="focus-ring inline-flex size-10 items-center justify-center rounded-lg text-office-icon hover:bg-office-chip disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
