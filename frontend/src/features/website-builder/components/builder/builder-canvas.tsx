"use client";

import { useState, type CSSProperties, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Layers,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { LocalThumbnail } from "../local-thumbnail";
import {
  BLOCK_TYPES,
  BLOCKS,
  BlockView,
  type BlockType,
} from "./builder-blocks";
import { AddSectionDialog } from "./add-section-dialog";
import type { Builder } from "./builder-state";
import { IconButton, MOVE_BLOCK_MIME, NEW_BLOCK_MIME } from "./blocks-panel";

type BuilderCanvasProps = {
  builder: Builder;
  name: string;
  logo: File | null;
  // CSS variables for colors and fonts, plus the page background.
  style: CSSProperties;
  images: Record<string, File[]>;
  previewing: boolean;
};

// The page being built inside a browser frame. Blocks are selected by
// clicking, and dropped in from the panel or dragged to a new place.
export function BuilderCanvas({
  builder,
  name,
  logo,
  style,
  images,
  previewing,
}: BuilderCanvasProps) {
  const { page, site, selected } = builder;
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function dropIndexAt(event: DragEvent<HTMLDivElement>) {
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        "[data-block-index]",
      ),
    ];
    const hit = items.find((item) => {
      const box = item.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    return hit ? Number(hit.dataset.blockIndex) : page.blocks.length;
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    const types = event.dataTransfer.types;
    if (!types.includes(NEW_BLOCK_MIME) && !types.includes(MOVE_BLOCK_MIME))
      return;
    event.preventDefault();
    event.dataTransfer.dropEffect = types.includes(MOVE_BLOCK_MIME)
      ? "move"
      : "copy";
    setDropIndex(dropIndexAt(event));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const index = dropIndexAt(event);
    const type = event.dataTransfer.getData(NEW_BLOCK_MIME) as BlockType;
    const moving = event.dataTransfer.getData(MOVE_BLOCK_MIME);
    if (type && BLOCK_TYPES.includes(type)) builder.addBlock(type, index);
    else if (moving) builder.moveBlock(moving, index);
    setDropIndex(null);
  }

  const indicator = (
    <div
      aria-hidden="true"
      className="relative z-10 -my-px h-0.5 bg-office-chart-bright"
    >
      <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-office-chart-bright" />
    </div>
  );

  return (
    <div
      className="@container mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-office-meter-track shadow-[0_8px_30px_rgb(15_107_110/0.08)]"
      style={style}
    >
      <div
        aria-hidden="true"
        className="flex h-7 items-center gap-1.5 border-b border-black/5 bg-[#eef1f4] px-3"
      >
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
      </div>

      <div className="bg-(--site-page) font-(family-name:--site-body) text-(--site-text)">
        {page.showNav ? (
          <header
            className={cn(
              "z-20 flex h-16 items-center gap-4 border-b border-black/5 bg-white px-6 text-[#1f2933] @3xl:px-8",
              page.stickyNav && "sticky top-0",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {logo ? (
                <LocalThumbnail
                  file={logo}
                  fit="contain"
                  className="size-9 shrink-0"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--site-primary) text-xs font-semibold text-(--site-on-primary)">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate font-(family-name:--site-heading) text-xl text-(--site-primary)">
                {name}
              </span>
            </span>
            <nav
              aria-label="Site menu preview"
              className="ml-auto hidden items-center gap-6 text-sm @3xl:flex"
            >
              {site.pages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => builder.goToPage(item.id)}
                  aria-current={item.id === page.id ? "page" : undefined}
                  className={cn(
                    "hover:text-(--site-primary)",
                    item.id === page.id && "font-semibold",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </nav>
            <span className="ml-auto inline-flex h-9 shrink-0 items-center rounded-md bg-(--site-primary) px-4 text-xs font-semibold text-(--site-on-primary) @3xl:ml-0">
              Book Now
            </span>
          </header>
        ) : null}

        <div
          onDragOver={handleDragOver}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setDropIndex(null);
          }}
          onDrop={handleDrop}
          className={cn(
            page.width === "boxed" && "mx-auto max-w-3xl",
            !page.blocks.length && "p-6",
          )}
        >
          {page.blocks.length ? (
            page.blocks.map((block, index) => {
              const active = !previewing && selected?.id === block.id;
              const { label } = BLOCKS[block.type];
              return (
                <div key={block.id}>
                  {dropIndex === index ? indicator : null}
                  <div
                    data-block-index={index}
                    draggable={!previewing}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(MOVE_BLOCK_MIME, block.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDropIndex(null)}
                    onClick={
                      previewing ? undefined : () => builder.select(block.id)
                    }
                    className={cn(
                      "group relative",
                      !previewing &&
                        "cursor-pointer outline-offset-[-2px] hover:outline-2 hover:outline-dashed hover:outline-office-chart-bright/70",
                      active &&
                        "outline-2 outline-office-chart-bright hover:outline-solid",
                    )}
                  >
                    <BlockView block={block} images={images[block.id] ?? []} />
                    {previewing ? null : (
                      <>
                        <span
                          className={cn(
                            "pointer-events-none absolute top-2 left-2 z-10 items-center gap-1 rounded-md bg-office-chart-bright px-2 py-0.5 text-[0.7rem] font-semibold text-white",
                            active
                              ? "inline-flex"
                              : "hidden group-hover:inline-flex",
                          )}
                        >
                          <GripVertical aria-hidden="true" className="size-3" />
                          {label}
                        </span>
                        {active ? (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute top-2 right-2 z-10 flex rounded-lg border border-office-meter-track bg-card p-0.5 shadow-md"
                          >
                            <IconButton
                              label={`Move ${label} up`}
                              disabled={index === 0}
                              onClick={() =>
                                builder.moveBlock(block.id, index - 1)
                              }
                            >
                              <ArrowUp className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`Move ${label} down`}
                              disabled={index === page.blocks.length - 1}
                              onClick={() =>
                                builder.moveBlock(block.id, index + 2)
                              }
                            >
                              <ArrowDown className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`Duplicate ${label}`}
                              onClick={() => builder.duplicateBlock(block.id)}
                            >
                              <Copy className="size-4" />
                            </IconButton>
                            <IconButton
                              label={`Delete ${label}`}
                              onClick={() => builder.deleteBlock(block.id)}
                              className="hover:bg-office-danger-soft hover:text-office-danger-text"
                            >
                              <Trash2 className="size-4" />
                            </IconButton>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyPage builder={builder} dragging={dropIndex !== null} />
          )}
          {page.blocks.length && dropIndex === page.blocks.length
            ? indicator
            : null}
          {page.blocks.length && !previewing ? (
            <div className="flex justify-center py-5">
              <AddSectionDialog builder={builder} compact />
            </div>
          ) : null}
        </div>

        {page.showFooter ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 bg-(--site-secondary) px-6 py-6 text-white/85 @3xl:px-8">
            <span className="font-(family-name:--site-heading) text-lg text-white">
              {name}
            </span>
            <span className="text-xs">
              © {new Date().getFullYear()} {name}
            </span>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPage({
  builder,
  dragging,
}: {
  builder: Builder;
  dragging: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        dragging
          ? "border-office-chart-bright bg-office-chart-fill/60"
          : "border-office-chart-bright/40 bg-[#f6fbfb]",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-office-tint-teal text-office-primary">
        <Layers aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-office-icon">
        Start building your page
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-office-muted">
        Your page is a blank canvas. Drag a block from the left panel, or add
        your first section. Most guest house sites start with a Hero.
      </p>
      <div className="mt-6">
        <AddSectionDialog builder={builder} />
      </div>
    </div>
  );
}
