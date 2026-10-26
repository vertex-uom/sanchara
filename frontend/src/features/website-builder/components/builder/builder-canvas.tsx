"use client";

import { useState, type CSSProperties, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  EyeOff,
  GripVertical,
  Layers,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { LocalThumbnail } from "../local-thumbnail";
import { AddSectionDialog } from "./add-section-dialog";
import { EditorContext } from "./editable-text";
import {
  blockDisplayName,
  BLOCKS,
  BOOKING_LINK,
  BlockView,
  isSection,
  type BuilderBlock,
} from "./builder-blocks";
import type { Builder, PageBackground } from "./builder-state";
import { IconButton } from "./blocks-panel";
import { moveBlockMime, readDrag, type DragItem } from "./drag";
import { BACKGROUND_KEYS, SECTION_BACKGROUNDS } from "./settings-panel";

type BuilderCanvasProps = {
  builder: Builder;
  name: string;
  tagline: string;
  logo: File | null;
  // CSS variables for colors and fonts, plus the page background.
  style: CSSProperties;
  backgrounds: Record<PageBackground, string>;
  images: Record<string, File[]>;
  previewing: boolean;
};

const SPACING: Record<string, [string, string]> = {
  Compact: ["1.5rem", "2rem"],
  Spacious: ["3.5rem", "5rem"],
};

// A section's Style settings as CSS: background (with readable text on the
// dark one) and vertical spacing.
function sectionStyle(
  block: BuilderBlock,
  backgrounds: Record<PageBackground, string>,
) {
  const style: Record<string, string> = {};
  const background = block.props.background as
    (typeof SECTION_BACKGROUNDS)[number] | undefined;
  const key = background ? BACKGROUND_KEYS[background] : null;
  if (key) {
    style.backgroundColor = backgrounds[key];
    const dark = key === "dark";
    style["--site-text"] = dark ? "#ffffff" : "#1f2933";
    style["--site-muted"] = dark ? "rgb(255 255 255 / 0.75)" : "#475569";
    style["--site-surface"] = dark ? "rgb(255 255 255 / 0.08)" : "#f5f7f8";
  }
  const spacing = SPACING[block.props.spacing];
  if (spacing) {
    style["--section-py"] = spacing[0];
    style["--section-py-lg"] = spacing[1];
  }
  return style as CSSProperties;
}

// The page being built inside a browser frame. Blocks are selected by
// clicking, and dropped in from the panel or dragged to a new place.
export function BuilderCanvas({
  builder,
  name,
  tagline,
  logo,
  style,
  backgrounds,
  images,
  previewing,
}: BuilderCanvasProps) {
  const { page, site, selected } = builder;
  const [drop, setDrop] = useState<{ index: number; item: DragItem } | null>(
    null,
  );
  const blocks = previewing
    ? page.blocks.filter((block) => block.props.hidden !== "true")
    : page.blocks;
  // Footer contact details come from the site's first Contact section.
  const contact = site.pages
    .flatMap((item) => item.blocks)
    .find((block) => block.type === "contact")?.props;

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
    const item = readDrag(event.dataTransfer.types);
    if (!item) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = item.kind === "move" ? "move" : "copy";
    const index = dropIndexAt(event);
    if (drop?.index !== index || drop.item.kind !== item.kind)
      setDrop({ index, item });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const item = readDrag(event.dataTransfer.types);
    const index = dropIndexAt(event);
    if (item?.kind === "new") builder.addBlock(item.type, index);
    if (item?.kind === "move") builder.moveBlock(item.id, index);
    setDrop(null);
  }

  function dropLabel(item: DragItem) {
    if (item.kind === "new") return `Drop ${BLOCKS[item.type].label} here`;
    const moving = page.blocks.find((block) => block.id === item.id);
    return moving ? `Move ${BLOCKS[moving.type].label} here` : "Move here";
  }

  const indicator = drop ? (
    <div
      aria-hidden="true"
      className="relative z-20 -my-px h-0.5 bg-office-chart-bright"
    >
      <span className="absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-office-chart-bright px-3 py-1 text-xs font-semibold whitespace-nowrap text-white shadow">
        <Plus className="size-3.5" />
        {dropLabel(drop.item)}
      </span>
    </div>
  ) : null;

  // Pages in the site menu and the footer's quick links.
  const menuPages = site.pages.filter((item) => item.inNav !== false);

  const editor = {
    selectedId: selected?.id ?? null,
    previewing,
    update: builder.updateBlock,
    links: [BOOKING_LINK, ...site.pages.map((item) => `${item.name} page`)],
  };

  return (
    <EditorContext.Provider value={editor}>
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
                "z-30 flex h-16 items-center gap-4 border-b border-black/5 bg-white px-6 text-[#1f2933] @3xl:px-8",
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
                {menuPages.map((item) => (
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
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setDrop(null);
            }}
            onDrop={handleDrop}
            className={cn(
              page.width === "boxed" && "mx-auto max-w-3xl",
              !blocks.length && "p-6",
            )}
          >
            {blocks.length ? (
              blocks.map((block) => {
                const index = page.blocks.indexOf(block);
                const active = !previewing && selected?.id === block.id;
                const hidden = block.props.hidden === "true";
                const { label } = BLOCKS[block.type];
                const name =
                  isSection(block.type) && block.props.layout
                    ? `${blockDisplayName(block)} · ${block.props.layout}`
                    : label;
                return (
                  <div key={block.id}>
                    {drop?.index === index ? indicator : null}
                    <div
                      data-block-index={index}
                      id={
                        block.props.anchor
                          ? `section-${block.props.anchor}`
                          : undefined
                      }
                      draggable={!previewing && !active}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          moveBlockMime(block.id),
                          block.id,
                        );
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDrop(null)}
                      onClick={
                        previewing ? undefined : () => builder.select(block.id)
                      }
                      style={sectionStyle(block, backgrounds)}
                      className={cn(
                        "group relative",
                        !previewing &&
                          "cursor-pointer outline-offset-[-2px] hover:outline-2 hover:outline-dashed hover:outline-office-chart-bright/70",
                        active &&
                          "outline-2 outline-office-chart-bright hover:outline-solid",
                        hidden && "opacity-45",
                      )}
                    >
                      <BlockView
                        block={block}
                        images={images[block.id] ?? []}
                      />
                      {previewing ? null : (
                        <>
                          <span
                            draggable={active}
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                moveBlockMime(block.id),
                                block.id,
                              );
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => setDrop(null)}
                            title={active ? "Drag to move" : undefined}
                            className={cn(
                              "absolute top-2 left-2 z-10 items-center gap-1 rounded-md bg-office-chart-bright px-2 py-0.5 text-[0.7rem] font-semibold text-white",
                              active
                                ? "cursor-grab active:cursor-grabbing"
                                : "pointer-events-none",
                              active || hidden
                                ? "inline-flex"
                                : "hidden group-hover:inline-flex",
                            )}
                          >
                            {hidden ? (
                              <EyeOff aria-hidden="true" className="size-3" />
                            ) : (
                              <GripVertical
                                aria-hidden="true"
                                className="size-3"
                              />
                            )}
                            {hidden ? `${name} · Hidden` : name}
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
                              {isSection(block.type) ? (
                                <AddSectionDialog
                                  builder={builder}
                                  trigger="icon"
                                  change={{
                                    blockId: block.id,
                                    type: block.type,
                                    layout: block.props.layout ?? "",
                                  }}
                                />
                              ) : null}
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
              <EmptyPage builder={builder} dragging={drop !== null} />
            )}
            {blocks.length > 0 && drop?.index === page.blocks.length
              ? indicator
              : null}
            {blocks.length > 0 && !previewing ? (
              <div className="px-6 py-5">
                <div className="flex justify-center rounded-xl border-2 border-dashed border-office-chart-bright/40 py-4">
                  <AddSectionDialog builder={builder} compact />
                </div>
              </div>
            ) : null}
          </div>

          {page.showFooter ? (
            <footer className="bg-(--site-secondary) px-6 pt-10 pb-6 text-sm text-white/75 @3xl:px-10">
              <div className="grid gap-8 @3xl:grid-cols-[2fr_1fr_1fr]">
                <div>
                  <p className="font-(family-name:--site-heading) text-xl text-white">
                    {name}
                  </p>
                  {tagline ? <p className="mt-2 max-w-xs">{tagline}</p> : null}
                </div>
                <div>
                  <p className="font-semibold text-white">Quick Links</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {menuPages.map((item) => (
                      <li key={item.id}>{item.name}</li>
                    ))}
                  </ul>
                </div>
                {contact &&
                (contact.address || contact.phone || contact.email) ? (
                  <div>
                    <p className="font-semibold text-white">Contact Us</p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {contact.address ? (
                        <FooterLine icon={MapPin}>{contact.address}</FooterLine>
                      ) : null}
                      {contact.phone ? (
                        <FooterLine icon={Phone}>{contact.phone}</FooterLine>
                      ) : null}
                      {contact.email ? (
                        <FooterLine icon={Mail}>{contact.email}</FooterLine>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs">
                <span>
                  © {new Date().getFullYear()} {name}. All rights reserved.
                </span>
                <span className="flex gap-4">
                  <span>Privacy Policy</span>
                  <span>Terms &amp; Conditions</span>
                  <span>Sitemap</span>
                </span>
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </EditorContext.Provider>
  );
}

function FooterLine({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {children}
    </li>
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
