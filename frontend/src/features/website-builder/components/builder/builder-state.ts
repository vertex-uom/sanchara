"use client";

import { useRef, useState } from "react";
import { DRAFT_KEYS, useTemplateDraft } from "../template-draft";
import {
  BLOCKS,
  type BlockContext,
  type BlockType,
  type BuilderBlock,
} from "./builder-blocks";

export type PageBackground = "white" | "brand" | "light" | "aqua" | "dark";

export type BuilderPage = {
  id: string;
  name: string;
  // "/" for the home page, "/rooms" and so on for the rest.
  path: string;
  background: PageBackground;
  width: "full" | "boxed";
  showNav: boolean;
  stickyNav: boolean;
  showFooter: boolean;
  // Missing in drafts from before these existed: shown, indexed.
  inNav?: boolean;
  noIndex?: boolean;
  blocks: BuilderBlock[];
};

export type ScratchSite = { pages: BuilderPage[] };

const HISTORY_LIMIT = 50;
// Typing in one field within this time is one undo step.
const MERGE_MS = 1200;

const HOME: BuilderPage = {
  id: "home",
  name: "Home",
  path: "/",
  background: "white",
  width: "full",
  showNav: true,
  stickyNav: true,
  showFooter: true,
  blocks: [],
};

export function pagePath(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/${slug || "page"}`;
}

// The "Start from scratch" site being built, with undo/redo. Every change
// is saved to the browser draft straight away.
export function useBuilder(context: BlockContext) {
  const draft = useTemplateDraft<ScratchSite>(DRAFT_KEYS.scratchSite, {
    pages: [HOME],
  });
  const site = draft.values.pages?.length ? draft.values : { pages: [HOME] };
  const [history, setHistory] = useState<{
    past: ScratchSite[];
    future: ScratchSite[];
  }>({ past: [], future: [] });
  const [pageId, setPageId] = useState(HOME.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The "Add a new page" dialog, opened from the page menu and Layers.
  const [addingPage, setAddingPage] = useState(false);
  const lastMerge = useRef<{ key: string; at: number } | null>(null);

  const page = site.pages.find((item) => item.id === pageId) ?? site.pages[0];

  function commit(next: ScratchSite, mergeKey?: string) {
    const now = Date.now();
    const merge =
      mergeKey &&
      lastMerge.current?.key === mergeKey &&
      now - lastMerge.current.at < MERGE_MS;
    lastMerge.current = mergeKey ? { key: mergeKey, at: now } : null;
    if (!merge) {
      setHistory((current) => ({
        past: [...current.past, site].slice(-HISTORY_LIMIT),
        future: [],
      }));
    }
    draft.save(next);
  }

  function updatePage(patch: Partial<BuilderPage>, mergeKey?: string) {
    commit(
      {
        pages: site.pages.map((item) =>
          item.id === page.id ? { ...item, ...patch } : item,
        ),
      },
      mergeKey ? `page:${page.id}:${mergeKey}` : undefined,
    );
  }

  function setBlocks(blocks: BuilderBlock[], mergeKey?: string) {
    updatePage({ blocks }, mergeKey);
  }

  // overrides: props chosen when adding, such as a section's layout.
  function addBlock(
    type: BlockType,
    index = page.blocks.length,
    overrides: Record<string, string> = {},
  ) {
    const block: BuilderBlock = {
      id: crypto.randomUUID(),
      type,
      props: { ...BLOCKS[type].defaults(context), ...overrides },
    };
    const blocks = [...page.blocks];
    blocks.splice(index, 0, block);
    setBlocks(blocks);
    setSelectedId(block.id);
    return block.id;
  }

  // Moves a block so it ends up before the block now at `index`.
  function moveBlock(id: string, index: number) {
    const from = page.blocks.findIndex((block) => block.id === id);
    if (from < 0) return;
    const blocks = [...page.blocks];
    const [block] = blocks.splice(from, 1);
    blocks.splice(index > from ? index - 1 : index, 0, block);
    if (blocks.every((item, position) => item === page.blocks[position]))
      return;
    setBlocks(blocks);
  }

  function updateBlock(id: string, key: string, value: string) {
    setBlocks(
      page.blocks.map((block) =>
        block.id === id
          ? { ...block, props: { ...block.props, [key]: value } }
          : block,
      ),
      `${id}:${key}`,
    );
  }

  function duplicateBlock(id: string) {
    const index = page.blocks.findIndex((block) => block.id === id);
    if (index < 0) return null;
    const copy = { ...page.blocks[index], id: crypto.randomUUID() };
    const blocks = [...page.blocks];
    blocks.splice(index + 1, 0, copy);
    setBlocks(blocks);
    setSelectedId(copy.id);
    return copy.id;
  }

  function deleteBlock(id: string) {
    setBlocks(page.blocks.filter((block) => block.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function pathTaken(path: string) {
    return site.pages.some((item) => item.path === path);
  }

  // A new page from the "Add a new page" dialog, with its starting sections.
  function addPage(spec: {
    name: string;
    path: string;
    inNav: boolean;
    noIndex: boolean;
    sections: { type: BlockType; props?: Record<string, string> }[];
  }) {
    const created: BuilderPage = {
      ...HOME,
      id: crypto.randomUUID(),
      name: spec.name,
      path: spec.path,
      inNav: spec.inNav,
      noIndex: spec.noIndex,
      blocks: spec.sections.map(({ type, props }) => ({
        id: crypto.randomUUID(),
        type,
        props: { ...BLOCKS[type].defaults(context), ...props },
      })),
    };
    commit({ pages: [...site.pages, created] });
    setPageId(created.id);
    setSelectedId(null);
  }

  function deletePage(id = page.id) {
    if (id === HOME.id) return;
    commit({ pages: site.pages.filter((item) => item.id !== id) });
    if (id === page.id) setPageId(HOME.id);
    setSelectedId(null);
  }

  // Copies a page and its blocks (block photos stay with the original).
  function duplicatePage(id: string) {
    const source = site.pages.find((item) => item.id === id);
    if (!source) return;
    const taken = new Set(site.pages.map((item) => item.path));
    let name = `${source.name} copy`;
    for (let number = 2; taken.has(pagePath(name)); number++)
      name = `${source.name} copy ${number}`;
    const copy: BuilderPage = {
      ...source,
      id: crypto.randomUUID(),
      name,
      path: pagePath(name),
      blocks: source.blocks.map((block) => ({
        ...block,
        id: crypto.randomUUID(),
      })),
    };
    const at = site.pages.indexOf(source) + 1;
    commit({
      pages: [...site.pages.slice(0, at), copy, ...site.pages.slice(at)],
    });
    setPageId(copy.id);
    setSelectedId(null);
  }

  function goToPage(id: string) {
    setPageId(id);
    setSelectedId(null);
  }

  function undo() {
    const previous = history.past.at(-1);
    if (!previous) return;
    setHistory({
      past: history.past.slice(0, -1),
      future: [site, ...history.future],
    });
    lastMerge.current = null;
    draft.save(previous);
    if (!previous.pages.some((item) => item.id === pageId)) setPageId(HOME.id);
  }

  function redo() {
    const next = history.future[0];
    if (!next) return;
    setHistory({
      past: [...history.past, site],
      future: history.future.slice(1),
    });
    lastMerge.current = null;
    draft.save(next);
    if (!next.pages.some((item) => item.id === pageId)) setPageId(HOME.id);
  }

  const selected = page.blocks.find((block) => block.id === selectedId) ?? null;

  return {
    site,
    page,
    selected,
    saved: draft.saved,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    select: setSelectedId,
    goToPage,
    addPage,
    pathTaken,
    addingPage,
    setAddingPage,
    deletePage,
    duplicatePage,
    updatePage,
    addBlock,
    moveBlock,
    updateBlock,
    duplicateBlock,
    deleteBlock,
    undo,
    redo,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
