"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { LocalThumbnail } from "../local-thumbnail";
import { PhotoGallery } from "../photo-gallery";
import { Field, inputClass, SelectInput, Switch } from "../template-fields";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { AddSectionDialog } from "./add-section-dialog";
import { NavSettings } from "./nav-settings";
import { StyleTab } from "./style-tab";
import {
  BLOCKS,
  BOOKING_LINK,
  isSection,
  type BuilderBlock,
  type FieldDef,
} from "./builder-blocks";
import type { Builder, PageBackground } from "./builder-state";
import { pagePath } from "./builder-state";
import { SECTION_LAYOUTS } from "./section-layouts";

const MB = 1024 * 1024;
export const NO_BLOCK_IMAGES: Record<string, File[]> = {};

type SettingsPanelProps = {
  builder: Builder;
  address: string;
  // Swatch colors for each page background option.
  backgrounds: Record<PageBackground, string>;
};

// Right panel: settings for the selected block, or for the page.
export function SettingsPanel({
  builder,
  address,
  backgrounds,
}: SettingsPanelProps) {
  if (builder.navSelected) return <NavSettings builder={builder} />;
  return builder.selected ? (
    <BlockSettings
      builder={builder}
      block={builder.selected}
      backgrounds={backgrounds}
    />
  ) : (
    <PageSettings
      builder={builder}
      address={address}
      backgrounds={backgrounds}
    />
  );
}

function PageSettings({ builder, address, backgrounds }: SettingsPanelProps) {
  const { page } = builder;
  const home = page.path === "/";

  return (
    <div className="flex flex-col gap-5 p-5">
      <h2 className="text-lg font-semibold text-office-icon">Page Settings</h2>
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
}: {
  builder: Builder;
  block: BuilderBlock;
  backgrounds: Record<PageBackground, string>;
}) {
  const [tab, setTab] = useState<BlockTab>("content");
  const { label, icon: Icon, fields } = BLOCKS[block.type];
  const section = isSection(block.type) ? block.type : null;
  const layout = section
    ? (SECTION_LAYOUTS[section].find(
        (option) => option.label === block.props.layout,
      ) ?? SECTION_LAYOUTS[section][0])
    : null;
  const index = builder.page.blocks.findIndex((item) => item.id === block.id);
  const last = builder.page.blocks.length - 1;
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
            className="block aspect-[16/9] w-20 shrink-0 overflow-hidden rounded-md"
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
        {tab === "content" ? (
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

        {tab === "style" ? (
          <StyleTab builder={builder} block={block} backgrounds={backgrounds} />
        ) : null}

        {tab === "advanced" ? (
          <>
            <Field
              id={`block-${block.id}-anchor`}
              label="Section ID"
              hint="For menu links, e.g. rooms"
            >
              <input
                id={`block-${block.id}-anchor`}
                value={block.props.anchor ?? ""}
                maxLength={40}
                onChange={(event) =>
                  set(
                    "anchor",
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/^-/, ""),
                  )
                }
                placeholder={block.type}
                className={inputClass}
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span>
                <span
                  id={`block-${block.id}-hidden-label`}
                  className="block text-sm font-semibold text-office-icon"
                >
                  Hide this {section ? "section" : "block"}
                </span>
                <span className="block text-xs text-office-muted">
                  Kept in the builder, left out of the site.
                </span>
              </span>
              <Switch
                aria-labelledby={`block-${block.id}-hidden-label`}
                checked={block.props.hidden === "true"}
                onChange={(hidden) => set("hidden", hidden ? "true" : "")}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-office-meter-track pt-5">
        <ActionButton
          disabled={index <= 0}
          onClick={() => builder.moveBlock(block.id, index - 1)}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
          Move up
        </ActionButton>
        <ActionButton
          disabled={index >= last}
          onClick={() => builder.moveBlock(block.id, index + 2)}
        >
          <ArrowDown aria-hidden="true" className="size-4" />
          Move down
        </ActionButton>
        <ActionButton onClick={() => builder.duplicateBlock(block.id)}>
          <Copy aria-hidden="true" className="size-4" />
          Duplicate
        </ActionButton>
        <ActionButton danger onClick={() => builder.deleteBlock(block.id)}>
          <Trash2 aria-hidden="true" className="size-4" />
          Delete
        </ActionButton>
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
        id={id}
        label={field.label}
        file={images[block.id]?.[0]}
        onChange={(file) => setFiles([file])}
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

function ActionButton({
  danger,
  disabled,
  onClick,
  children,
}: {
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-9 gap-1.5 border-office-meter-track bg-card text-sm font-medium",
        danger
          ? "text-office-danger-text hover:bg-office-danger-soft"
          : "text-office-icon hover:bg-office-chip",
      )}
    >
      {children}
    </Button>
  );
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// One photo: a large preview with "Change Image", or an add button.
function ImagePicker({
  id,
  label,
  file,
  onChange,
}: {
  id: string;
  label: string;
  file: File | undefined;
  onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(selected: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!selected) return;
    if (!IMAGE_TYPES.includes(selected.type) || selected.size > 10 * MB) {
      setError("Use a JPG, PNG or WebP image up to 10 MB.");
      return;
    }
    setError(null);
    onChange(selected);
  }

  return (
    <div>
      <p
        id={`${id}-label`}
        className="mb-2 text-sm font-semibold text-office-icon"
      >
        {label}
      </p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        aria-labelledby={`${id}-label`}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0])}
      />
      {file ? (
        <>
          <LocalThumbnail
            file={file}
            className="aspect-[16/7] w-full rounded-lg"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="mt-2 h-10 w-full gap-2 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
          >
            <ImageIcon aria-hidden="true" className="size-4" />
            Change Image
          </Button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex aspect-[16/7] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-office-primary/60 bg-card text-sm font-semibold text-office-primary hover:bg-office-tint-teal"
        >
          <ImagePlus aria-hidden="true" className="size-5" />
          Add image
          <span className="text-xs font-normal text-office-muted">
            JPG, PNG or WebP, up to 10 MB
          </span>
        </button>
      )}
      {error ? (
        <p
          role="alert"
          className="mt-1.5 text-xs font-medium text-office-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
