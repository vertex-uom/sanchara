"use client";

import { useState, type ReactNode } from "react";
import { Layers, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOCK_TYPES, BLOCKS, type BlockType } from "./builder-blocks";
import type { Builder } from "./builder-state";
import { newBlockMime } from "./drag";
import { LayersPanel } from "./layers-panel";

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
          <LayersPanel builder={builder} />
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
