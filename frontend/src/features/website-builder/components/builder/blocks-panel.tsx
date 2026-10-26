"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { BLOCK_TYPES, BLOCKS, type BlockType } from "./builder-blocks";
import type { Builder } from "./builder-state";

// Drags carry what they are in the dataTransfer *type* (data can only be
// read on drop), so the canvas can say "Drop Gallery here" while dragging.
const NEW_BLOCK_PREFIX = "application/x-sanchara-block-";
const MOVE_BLOCK_PREFIX = "application/x-sanchara-move-";

export const newBlockMime = (type: BlockType) => `${NEW_BLOCK_PREFIX}${type}`;
export const moveBlockMime = (id: string) => `${MOVE_BLOCK_PREFIX}${id}`;

export type DragItem =
  { kind: "new"; type: BlockType } | { kind: "move"; id: string };

export function readDrag(types: readonly string[]): DragItem | null {
  for (const type of types) {
    if (type.startsWith(NEW_BLOCK_PREFIX)) {
      const block = type.slice(NEW_BLOCK_PREFIX.length) as BlockType;
      if (BLOCK_TYPES.includes(block)) return { kind: "new", type: block };
    }
    if (type.startsWith(MOVE_BLOCK_PREFIX))
      return { kind: "move", id: type.slice(MOVE_BLOCK_PREFIX.length) };
  }
  return null;
}

// Left panel: blocks to add (click or drag onto the canvas) and the page's layers.
export function BlocksPanel({ builder }: { builder: Builder }) {
  const [tab, setTab] = useState<"blocks" | "layers">("blocks");
  const [query, setQuery] = useState("");
  const shown = BLOCK_TYPES.filter((type) =>
    BLOCKS[type].label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div
        role="tablist"
        aria-label="Builder panel"
        className="grid grid-cols-2 rounded-xl bg-office-chip p-1"
      >
        <TabButton
          active={tab === "blocks"}
          onClick={() => setTab("blocks")}
          controls="builder-blocks"
        >
          <Plus aria-hidden="true" className="size-4" />
          Blocks
        </TabButton>
        <TabButton
          active={tab === "layers"}
          onClick={() => setTab("layers")}
          controls="builder-layers"
        >
          <Layers aria-hidden="true" className="size-4" />
          Layers
        </TabButton>
      </div>

      {tab === "blocks" ? (
        <div
          id="builder-blocks"
          role="tabpanel"
          className="flex flex-col gap-4"
        >
          <label className="flex h-10 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3 has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
            <Search aria-hidden="true" className="size-4 text-office-muted" />
            <span className="sr-only">Search blocks</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blocks..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-office-muted/80"
            />
          </label>
          <BlockGroup
            title="Sections"
            types={shown.filter((type) => BLOCKS[type].group === "section")}
            builder={builder}
          />
          <BlockGroup
            title="Basic elements"
            types={shown.filter((type) => BLOCKS[type].group === "element")}
            builder={builder}
          />
          {shown.length ? null : (
            <p className="text-sm text-office-muted">
              No blocks match “{query}”.
            </p>
          )}
        </div>
      ) : (
        <div id="builder-layers" role="tabpanel">
          <LayersList builder={builder} />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  controls,
  children,
}: {
  active: boolean;
  onClick: () => void;
  controls: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "focus-ring flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
        active
          ? "bg-card font-semibold text-office-icon shadow-sm"
          : "text-office-muted",
      )}
    >
      {children}
    </button>
  );
}

function BlockGroup({
  title,
  types,
  builder,
}: {
  title: string;
  types: BlockType[];
  builder: Builder;
}) {
  if (!types.length) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-xs font-semibold tracking-[0.12em] text-office-muted uppercase">
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5">
        {types.map((type) => {
          const { label, icon: Icon } = BLOCKS[type];
          return (
            <li key={type}>
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(newBlockMime(type), type);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => builder.addBlock(type)}
                aria-label={`Add ${label}`}
                className="focus-ring flex h-full w-full cursor-grab flex-col items-center gap-2 rounded-xl border border-office-meter-track bg-card px-2 py-3 text-xs font-medium text-office-icon transition-colors hover:border-brand-cyan/70 hover:bg-[#f8fcfd] active:cursor-grabbing"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-office-tint-teal text-office-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LayersList({ builder }: { builder: Builder }) {
  const { page, selected } = builder;
  if (!page.blocks.length) {
    return (
      <p className="text-sm text-office-muted">
        This page has no blocks yet. Add one from the Blocks tab.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {page.blocks.map((block, index) => {
        const { label, icon: Icon } = BLOCKS[block.type];
        const active = selected?.id === block.id;
        return (
          <li
            key={block.id}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-1.5 py-1",
              active
                ? "border-brand-cyan bg-[#f8fcfd]"
                : "border-transparent hover:bg-office-chip",
            )}
          >
            <button
              type="button"
              onClick={() => builder.select(block.id)}
              aria-current={active ? "true" : undefined}
              className="focus-ring flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm text-office-icon"
            >
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-office-primary"
              />
              <span className="truncate">{label}</span>
            </button>
            <IconButton
              label={`Move ${label} up`}
              disabled={index === 0}
              onClick={() => builder.moveBlock(block.id, index - 1)}
            >
              <ChevronUp className="size-4" />
            </IconButton>
            <IconButton
              label={`Move ${label} down`}
              disabled={index === page.blocks.length - 1}
              onClick={() => builder.moveBlock(block.id, index + 2)}
            >
              <ChevronDown className="size-4" />
            </IconButton>
            <IconButton
              label={`Delete ${label}`}
              onClick={() => builder.deleteBlock(block.id)}
            >
              <Trash2 className="size-4" />
            </IconButton>
          </li>
        );
      })}
    </ol>
  );
}

export function IconButton({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md text-office-icon hover:bg-office-chip disabled:opacity-35 disabled:hover:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}
