"use client";

import { useState, type DragEvent } from "react";
import { DropdownMenu } from "radix-ui";
import {
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  House,
  Lock,
  Menu,
  PanelBottom,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { blockDisplayName, BLOCKS } from "./builder-blocks";
import {
  NAV_SELECTION,
  PAGE_SETTINGS_SELECTION,
  type Builder,
} from "./builder-state";
import { moveBlockMime, readDrag } from "./drag";

// Layers tab: the site's pages, then the sections of the open page in order
// (drag to reorder, eye to hide). Navigation and footer are shared by all
// pages and set in Page settings.
export function LayersPanel({ builder }: { builder: Builder }) {
  const { site, page } = builder;
  // Header and footer count as sections, as on the page itself.
  const count =
    page.blocks.length + (page.showNav ? 1 : 0) + (page.showFooter ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="layers-pages">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="layers-pages"
            className="text-xs font-semibold tracking-[0.12em] text-office-muted uppercase"
          >
            Pages
          </h2>
          <button
            type="button"
            onClick={() => builder.setAddingPage(true)}
            className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-semibold text-office-primary hover:underline"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Add page
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {site.pages.map((item) => {
            const home = item.path === "/";
            const current = item.id === page.id;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center rounded-lg",
                  current ? "bg-office-tint-teal" : "hover:bg-office-chip",
                )}
              >
                <button
                  type="button"
                  onClick={() => builder.goToPage(item.id)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-office-icon",
                    current && "font-semibold",
                  )}
                >
                  {home ? (
                    <House aria-hidden="true" className="size-4 shrink-0" />
                  ) : (
                    <FileText aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                  {home ? (
                    <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[0.65rem] font-medium text-office-muted">
                      Homepage
                    </span>
                  ) : null}
                </button>
                <PageMenu
                  builder={builder}
                  pageId={item.id}
                  name={item.name}
                  home={home}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="layers-sections"
        className="border-t border-office-meter-track pt-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="layers-sections"
            className="text-xs font-semibold tracking-[0.12em] text-office-muted uppercase"
          >
            Sections on this page
          </h2>
          <span className="text-xs text-office-muted">{count}</span>
        </div>
        <SectionList builder={builder} />
      </section>
    </div>
  );
}

function PageMenu({
  builder,
  pageId,
  name,
  home,
}: {
  builder: Builder;
  pageId: string;
  name: string;
  home: boolean;
}) {
  const itemClass =
    "flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-office-icon outline-none data-highlighted:bg-office-nav-active";

  function rename() {
    builder.goToPage(pageId);
    builder.select(PAGE_SETTINGS_SELECTION);
    // Open Page settings and focus its name field.
    window.setTimeout(() => document.getElementById("page-name")?.focus(), 0);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${name} page options`}
        className="focus-ring mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-card hover:text-office-icon"
      >
        <Ellipsis aria-hidden="true" className="size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <DropdownMenu.Item onSelect={rename} className={itemClass}>
            <Pencil aria-hidden="true" className="size-4" />
            Rename
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => builder.duplicatePage(pageId)}
            className={itemClass}
          >
            <Copy aria-hidden="true" className="size-4" />
            Duplicate
          </DropdownMenu.Item>
          {home ? null : (
            <DropdownMenu.Item
              onSelect={() => builder.deletePage(pageId)}
              className={cn(
                itemClass,
                "text-office-danger-text data-highlighted:bg-office-danger-soft",
              )}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Delete
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SectionList({ builder }: { builder: Builder }) {
  const { page, selected } = builder;
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function indexAt(event: DragEvent<HTMLOListElement>) {
    const rows = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        "[data-layer-index]",
      ),
    ];
    const hit = rows.find((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    return hit ? Number(hit.dataset.layerIndex) : page.blocks.length;
  }

  function handleDragOver(event: DragEvent<HTMLOListElement>) {
    if (readDrag(event.dataTransfer.types)?.kind !== "move") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropIndex(indexAt(event));
  }

  function handleDrop(event: DragEvent<HTMLOListElement>) {
    event.preventDefault();
    const item = readDrag(event.dataTransfer.types);
    if (item?.kind === "move") builder.moveBlock(item.id, indexAt(event));
    setDropIndex(null);
  }

  const line = (
    <div
      aria-hidden="true"
      className="mb-1.5 h-0.5 rounded-full bg-office-chart-bright"
    />
  );

  return (
    <ol
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDropIndex(null);
      }}
      onDrop={handleDrop}
      className="flex flex-col gap-1.5"
    >
      {page.showNav ? (
        <GlobalRow
          icon={Menu}
          label="Navigation"
          onClick={() => builder.select(NAV_SELECTION)}
        />
      ) : null}
      {page.blocks.map((block, index) => {
        const { icon: Icon } = BLOCKS[block.type];
        const name = blockDisplayName(block);
        const active = selected?.id === block.id;
        const hidden = block.props.hidden === "true";
        const locked = block.props.locked === "true";
        return (
          <li key={block.id}>
            {dropIndex === index ? line : null}
            <div
              data-layer-index={index}
              draggable={!locked}
              onDragStart={(event) => {
                event.dataTransfer.setData(moveBlockMime(block.id), block.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDropIndex(null)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border bg-card py-1.5 pr-1.5 pl-1",
                active
                  ? "border-brand-cyan ring-1 ring-brand-cyan/40"
                  : "border-office-meter-track",
                hidden && "opacity-60",
              )}
            >
              {locked ? (
                <Lock
                  aria-hidden="true"
                  className="size-4 shrink-0 text-office-muted/70"
                />
              ) : (
                <GripVertical
                  aria-hidden="true"
                  className="size-4 shrink-0 cursor-grab text-office-muted/60"
                />
              )}
              <button
                type="button"
                onClick={() => builder.select(block.id)}
                aria-current={active ? "true" : undefined}
                className="focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-0.5 text-left text-sm text-office-icon"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-office-tint-teal text-office-primary">
                  <Icon aria-hidden="true" className="size-3.5" />
                </span>
                <span className={cn("truncate", active && "font-semibold")}>
                  {name}
                  {locked ? <span className="sr-only"> (locked)</span> : null}
                </span>
              </button>
              <button
                type="button"
                aria-label={hidden ? `Show ${name}` : `Hide ${name}`}
                aria-pressed={hidden}
                title={hidden ? "Hidden on the site" : "Shown on the site"}
                onClick={() =>
                  builder.updateBlock(block.id, "hidden", hidden ? "" : "true")
                }
                className="focus-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-office-chip hover:text-office-icon"
              >
                {hidden ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </li>
        );
      })}
      {dropIndex === page.blocks.length ? <li>{line}</li> : null}
      {page.blocks.length ? null : (
        <li className="rounded-xl border border-dashed border-office-meter-track px-3 py-4 text-center text-xs text-office-muted">
          No sections yet. Add one from the Blocks tab.
        </li>
      )}
      {page.showFooter ? (
        <GlobalRow
          icon={PanelBottom}
          label="Footer"
          onClick={() => builder.select(PAGE_SETTINGS_SELECTION)}
        />
      ) : null}
    </ol>
  );
}

// Navigation or footer: shared by every page, so it cannot be moved here.
function GlobalRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title="Shown on all pages. Turn it on or off in Page settings."
        className="focus-ring flex w-full items-center gap-2.5 rounded-xl border border-office-meter-track bg-office-chip/50 py-1.5 pr-2.5 pl-6 text-left"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-office-tint-teal text-office-primary">
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-office-icon">{label}</span>
          <span className="block text-[0.7rem] text-office-muted">
            Global · all pages
          </span>
        </span>
        <Lock aria-hidden="true" className="size-3.5 text-office-muted" />
      </button>
    </li>
  );
}
