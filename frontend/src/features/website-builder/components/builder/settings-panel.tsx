"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  ImagePlus,
  Lock,
  Trash2,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocalThumbnail } from "../local-thumbnail";
import { PhotoGallery } from "../photo-gallery";
import { Field, inputClass, SelectInput, Switch } from "../template-fields";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { AddSectionDialog } from "./add-section-dialog";
import { NavSettings } from "./nav-settings";
import { SiteStylesPanel } from "./site-styles-panel";
import type { SiteStyles } from "./site-styles";
import { AdvancedTab } from "./advanced-tab";
import { MediaLibrary } from "./media-library";
import { PageSummary } from "./page-summary";
import type { BookingEngineStatus } from "@/features/website";
import { StyleTab } from "./style-tab";
import {
  BLOCKS,
  BOOKING_LINK,
  isSection,
  type BuilderBlock,
  type FieldDef,
} from "./builder-blocks";
import type { Builder, PageBackground } from "./builder-state";
import { pagePath, STYLES_SELECTION } from "./builder-state";
import { SECTION_LAYOUTS } from "./section-layouts";

export const NO_BLOCK_IMAGES: Record<string, File[]> = {};

type SettingsPanelProps = {
  builder: Builder;
  address: string;
  // Swatch colors for each page background option.
  backgrounds: Record<PageBackground, string>;
  // Applied site styles, for the Site Styles panel.
  savedStyles: SiteStyles;
  // For the page summary shown when nothing is selected.
  images: Record<string, File[]>;
  bookingEngine: BookingEngineStatus;
  onPreview: () => void;
  reviewHref: string;
};

// Right panel: the selected block, navigation, site styles or page
// settings; the page summary when nothing is selected.
export function SettingsPanel({
  builder,
  address,
  backgrounds,
  savedStyles,
  images,
  bookingEngine,
  onPreview,
  reviewHref,
}: SettingsPanelProps) {
  if (builder.navSelected) return <NavSettings builder={builder} />;
  if (builder.stylesOpen)
    return <SiteStylesPanel builder={builder} saved={savedStyles} />;
  return builder.selected ? (
    <BlockSettings
      builder={builder}
      block={builder.selected}
      backgrounds={backgrounds}
      address={address}
    />
  ) : builder.pageSettingsOpen ? (
    <PageSettings
      builder={builder}
      address={address}
      backgrounds={backgrounds}
    />
  ) : (
    <PageSummary
      builder={builder}
      images={images}
      bookingEngine={bookingEngine}
      onPreview={onPreview}
      reviewHref={reviewHref}
    />
  );
}

function PageSettings({
  builder,
  address,
  backgrounds,
}: Pick<SettingsPanelProps, "builder" | "address" | "backgrounds">) {
  const { page } = builder;
  const home = page.path === "/";

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="mr-auto text-lg font-semibold text-office-icon">
          Page Settings
        </h2>
        <button
          type="button"
          onClick={() => builder.select(STYLES_SELECTION)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-office-primary hover:underline"
        >
          <Palette aria-hidden="true" className="size-4" />
          Site styles
        </button>
        <button
          type="button"
          aria-label="Close page settings"
          onClick={() => builder.select(null)}
          className="focus-ring inline-flex size-8 items-center justify-center rounded-md text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <Field id="page-name" label="Page name">
        <input
          id="page-name"
          value={page.name}
          maxLength={40}
          onChange={(event) =>
            builder.updatePage(
              {
                name: event.target.value,
                ...(home ? {} : { path: pagePath(event.target.value) }),
              },
              "name",
            )
          }
          className={inputClass}
        />
      </Field>
      <Field id="page-url" label="Page URL">
        <input
          id="page-url"
          readOnly
          value={`${address}${page.path}`}
          className={cn(inputClass, "text-office-muted")}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Page background
        </legend>
        <div className="flex gap-2.5">
          {(Object.keys(backgrounds) as PageBackground[]).map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="page-background"
                checked={page.background === option}
                onChange={() => builder.updatePage({ background: option })}
                className="peer sr-only"
              />
              <span className="sr-only">{BACKGROUND_LABELS[option]}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "block size-8 rounded-full border border-black/10 ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-office-primary",
                  page.background === option && "ring-2 ring-office-primary",
                )}
                style={{ backgroundColor: backgrounds[option] }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Content width
        </legend>
        <div className="grid grid-cols-2 rounded-lg border border-office-meter-track p-1">
          {(["full", "boxed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={page.width === option}
              onClick={() => builder.updatePage({ width: option })}
              className={cn(
                "focus-ring h-9 rounded-md text-sm font-medium capitalize",
                page.width === option
                  ? "bg-office-primary text-white"
                  : "text-office-icon hover:bg-office-chip",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-office-icon">
          Page layout
        </h3>
        <div className="flex flex-col gap-3">
          <SwitchRow
            id="show-nav"
            label="Show navigation bar"
            checked={page.showNav}
            onChange={(showNav) => builder.updatePage({ showNav })}
          />
          <SwitchRow
            id="sticky-nav"
            label="Sticky navigation"
            checked={page.stickyNav}
            disabled={!page.showNav}
            onChange={(stickyNav) => builder.updatePage({ stickyNav })}
          />
          <SwitchRow
            id="show-footer"
            label="Show footer"
            checked={page.showFooter}
            onChange={(showFooter) => builder.updatePage({ showFooter })}
          />
          <SwitchRow
            id="page-in-nav"
            label="Show in navigation menu"
            checked={page.inNav !== false}
            onChange={(inNav) => builder.updatePage({ inNav })}
          />
          <SwitchRow
            id="page-noindex"
            label="Hide from search engines"
            checked={page.noIndex === true}
            onChange={(noIndex) => builder.updatePage({ noIndex })}
          />
        </div>
      </div>

      {home ? null : (
        <Button
          type="button"
          variant="outline"
          onClick={() => builder.deletePage()}
          className="h-10 gap-2 border-office-danger/40 bg-card font-semibold text-office-danger-text hover:bg-office-danger-soft"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete this page
        </Button>
      )}
    </div>
  );
}

const BACKGROUND_LABELS: Record<PageBackground, string> = {
  white: "White",
  brand: "Brand background",
  light: "Light grey",
  aqua: "Light aqua",
  dark: "Dark",
};

function SwitchRow({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        disabled && "opacity-50",
      )}
    >
      <span id={`${id}-label`} className="text-sm text-office-icon">
        {label}
      </span>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

type BlockTab = "content" | "style" | "advanced";

function BlockSettings({
  builder,
  block,
  backgrounds,
  address,
}: {
  builder: Builder;
  block: BuilderBlock;
  backgrounds: Record<PageBackground, string>;
  address: string;
}) {
  const [tab, setTab] = useState<BlockTab>("content");
  const { label, icon: Icon, fields } = BLOCKS[block.type];
  const section = isSection(block.type) ? block.type : null;
  const layout = section
    ? (SECTION_LAYOUTS[section].find(
        (option) => option.label === block.props.layout,
      ) ?? SECTION_LAYOUTS[section][0])
    : null;
  const locked = block.props.locked === "true";
  const set = (key: string, value: string) =>
    builder.updateBlock(block.id, key, value);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-office-icon">
          <span className="flex size-8 items-center justify-center rounded-lg bg-office-tint-teal text-office-primary">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          {section ? `${label} Section` : label}
        </h2>
        <button
          type="button"
          aria-label="Close block settings"
          onClick={() => builder.select(null)}
          className="focus-ring inline-flex size-8 items-center justify-center rounded-md text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      {section && layout ? (
        <div className="flex items-center gap-3 rounded-xl border border-office-meter-track p-2.5">
          <span
            aria-hidden="true"
            className="block aspect-16/9 w-20 shrink-0 overflow-hidden rounded-md"
          >
            {layout.thumb}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-office-icon">
              {layout.label}
            </span>
            <span className="block text-xs text-office-muted">Layout</span>
          </span>
          <AddSectionDialog
            builder={builder}
            change={{ blockId: block.id, type: section, layout: layout.label }}
          />
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label={`${label} settings`}
        className="grid grid-cols-3 rounded-lg border border-office-meter-track p-1"
      >
        {(["content", "style", "advanced"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tab === option}
            aria-controls={`block-tab-${option}`}
            onClick={() => setTab(option)}
            className={cn(
              "focus-ring h-8 rounded-md text-sm capitalize",
              tab === option
                ? "border border-office-meter-track bg-card font-semibold text-office-icon shadow-sm"
                : "text-office-muted hover:text-office-icon",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div
        id={`block-tab-${tab}`}
        role="tabpanel"
        className="flex flex-col gap-5"
      >
        {locked && tab !== "advanced" ? (
          <p className="flex items-start gap-2.5 rounded-lg bg-office-chip p-3 text-sm text-office-icon">
            <Lock
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-office-muted"
            />
            <span>
              This {section ? "section" : "block"} is locked.{" "}
              <button
                type="button"
                onClick={() => set("locked", "")}
                className="focus-ring rounded font-semibold text-office-primary underline-offset-2 hover:underline"
              >
                Unlock to edit
              </button>
            </span>
          </p>
        ) : null}

        {!locked && tab === "content" ? (
          fields.length ? (
            fields.map((field) => (
              <BlockField
                key={field.key}
                builder={builder}
                block={block}
                field={field}
              />
            ))
          ) : (
            <p className="text-sm text-office-muted">
              This block has no content settings.
            </p>
          )
        ) : null}

        {!locked && tab === "style" ? (
          <StyleTab builder={builder} block={block} backgrounds={backgrounds} />
        ) : null}

        {tab === "advanced" ? (
          <AdvancedTab builder={builder} block={block} address={address} />
        ) : null}
      </div>
    </div>
  );
}

function BlockField({
  builder,
  block,
  field,
}: {
  builder: Builder;
  block: BuilderBlock;
  field: FieldDef;
}) {
  const [images, setImages] = useTemplateFiles(
    FILE_KEYS.scratchBlockImages,
    NO_BLOCK_IMAGES,
  );
  const id = `block-${block.id}-${field.key}`;
  const value = block.props[field.key] ?? "";
  const setFiles = (files: File[]) =>
    setImages((current) => ({ ...current, [block.id]: files }));

  // A Hero shows one background photo unless it is a Slider.
  const single =
    field.kind === "image" ||
    (block.type === "hero" &&
      field.key === "images" &&
      block.props.layout !== "Slider");
  if (single) {
    return (
      <ImagePicker
        label={field.label}
        target={
          block.type === "hero"
            ? "Hero background"
            : `${BLOCKS[block.type].label} ${field.label.toLowerCase()}`
        }
        file={images[block.id]?.[0]}
        onChange={(file, alt) => {
          setFiles([file]);
          builder.updateBlock(block.id, `${field.key}Alt`, alt);
        }}
      />
    );
  }
  if (field.kind === "images") {
    return (
      <div>
        <p className="mb-1 text-sm font-semibold text-office-icon">
          {field.label}
        </p>
        {field.hint ? (
          <p className="mb-2 text-xs text-office-muted">{field.hint}</p>
        ) : null}
        <PhotoGallery photos={images[block.id] ?? []} onChange={setFiles} />
      </div>
    );
  }
  return (
    <Field id={id} label={field.label} hint={field.hint}>
      {field.kind === "link" ? (
        <SelectInput
          id={id}
          options={[
            BOOKING_LINK,
            ...builder.site.pages.map((page) => `${page.name} page`),
          ]}
          value={value || BOOKING_LINK}
          onChange={(event) =>
            builder.updateBlock(block.id, field.key, event.target.value)
          }
        />
      ) : field.kind === "select" ? (
        <SelectInput
          id={id}
          options={field.options ?? []}
          value={value}
          onChange={(event) =>
            builder.updateBlock(block.id, field.key, event.target.value)
          }
        />
      ) : field.kind === "textarea" ? (
        <textarea
          id={id}
          rows={field.rows ?? 4}
          value={value}
          onChange={(event) =>
            builder.updateBlock(block.id, field.key, event.target.value)
          }
          className={cn(inputClass, "h-auto resize-y py-2.5 leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(event) =>
            builder.updateBlock(block.id, field.key, event.target.value)
          }
          className={inputClass}
        />
      )}
    </Field>
  );
}

// One photo: a large preview with "Change Image", or an add button.
function ImagePicker({
  label,
  target,
  file,
  onChange,
}: {
  label: string;
  // What the photo is for, shown in the Media Library.
  target: string;
  file: File | undefined;
  onChange: (file: File, alt: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-office-icon">{label}</p>
      {file ? (
        <>
          <LocalThumbnail
            file={file}
            className="aspect-16/7 w-full rounded-lg"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="mt-2 h-10 w-full gap-2 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
          >
            <ImageIcon aria-hidden="true" className="size-4" />
            Change Image
          </Button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex aspect-16/7 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-office-primary/60 bg-card text-sm font-semibold text-office-primary hover:bg-office-tint-teal"
        >
          <ImagePlus aria-hidden="true" className="size-5" />
          Add image
          <span className="text-xs font-normal text-office-muted">
            Choose from the Media Library
          </span>
        </button>
      )}
      <MediaLibrary
        open={open}
        onOpenChange={setOpen}
        target={target}
        onUse={onChange}
      />
    </div>
  );
}
