"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "../image-upload";
import { PhotoGallery } from "../photo-gallery";
import { Field, inputClass, SelectInput, Switch } from "../template-fields";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { BLOCKS, type BuilderBlock, type FieldDef } from "./builder-blocks";
import type { Builder, PageBackground } from "./builder-state";
import { pagePath } from "./builder-state";

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
  return builder.selected ? (
    <BlockSettings builder={builder} block={builder.selected} />
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
        </div>
      </div>

      {home ? null : (
        <Button
          type="button"
          variant="outline"
          onClick={builder.deletePage}
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

function BlockSettings({
  builder,
  block,
}: {
  builder: Builder;
  block: BuilderBlock;
}) {
  const { label, icon: Icon, fields } = BLOCKS[block.type];
  const index = builder.page.blocks.findIndex((item) => item.id === block.id);
  const last = builder.page.blocks.length - 1;

  return (
    <div className="flex flex-col gap-5 p-5">
      <button
        type="button"
        onClick={() => builder.select(null)}
        className="focus-ring inline-flex items-center gap-1.5 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Page settings
      </button>
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-office-icon">
        <span className="flex size-8 items-center justify-center rounded-lg bg-office-tint-teal text-office-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {label}
      </h2>

      {fields.length ? (
        fields.map((field) => (
          <BlockField
            key={field.key}
            builder={builder}
            block={block}
            field={field}
          />
        ))
      ) : (
        <p className="text-sm text-office-muted">This block has no settings.</p>
      )}

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

  if (field.kind === "image") {
    return (
      <ImageUpload
        id={id}
        label={field.label}
        hint="JPG or PNG, up to 10 MB"
        types={["image/jpeg", "image/png", "image/webp"]}
        maxBytes={10 * MB}
        file={images[block.id]?.[0] ?? null}
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
    <Field
      id={id}
      label={field.label}
      hint={field.kind === "textarea" ? field.hint : undefined}
    >
      {field.kind === "select" ? (
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
          rows={4}
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
