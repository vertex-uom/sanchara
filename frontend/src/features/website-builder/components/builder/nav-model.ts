// The site's navigation menu: items link to a page ("page:<id>") or a web
// address ("url:<href>"), and may have one level of sub-items.

export type NavItem = {
  id: string;
  // Empty for a page link: the page's current name is used.
  label: string;
  target: string;
  hidden?: boolean;
  children?: NavItem[];
};

export type NavCta = { show: boolean; label: string; target: string };

export type SiteNav = { items: NavItem[]; cta: NavCta };

// Default target for the call-to-action button.
export const BOOKING_TARGET = "section:booking";

type PageLike = { id: string; name: string; path: string; inNav?: boolean };

export const pageTarget = (id: string) => `page:${id}`;

export function navItemForPage(page: PageLike): NavItem {
  return { id: crypto.randomUUID(), label: "", target: pageTarget(page.id) };
}

// Until the menu is edited it is the pages that are "in the menu".
export function defaultNav(pages: PageLike[]): SiteNav {
  return {
    items: pages
      .filter((page) => page.inNav !== false)
      .map((page) => ({
        id: `default-${page.id}`,
        label: "",
        target: pageTarget(page.id),
      })),
    cta: { show: true, label: "Book Now", target: BOOKING_TARGET },
  };
}

// What an item shows and where it points, for menus and the item list.
export function describeTarget(target: string, pages: PageLike[]) {
  if (target === BOOKING_TARGET)
    return { label: "Booking section", detail: "Booking section", page: null };
  if (target.startsWith("page:")) {
    const page = pages.find((item) => `page:${item.id}` === target) ?? null;
    return {
      label: page?.name ?? "Missing page",
      detail: page?.path ?? "Page was deleted",
      page,
    };
  }
  const url = target.replace(/^url:/, "");
  return {
    label: url || "Web address",
    detail: url || "No address yet",
    page: null,
  };
}

export function itemLabel(item: NavItem, pages: PageLike[]) {
  return item.label.trim() || describeTarget(item.target, pages).label;
}

// Items (and sub-items) pointing at a page, removed.
export function withoutPage(items: NavItem[], pageId: string): NavItem[] {
  return items
    .filter((item) => item.target !== pageTarget(pageId))
    .map((item) =>
      item.children
        ? { ...item, children: withoutPage(item.children, pageId) }
        : item,
    );
}

export function hasPage(items: NavItem[], pageId: string): boolean {
  return items.some(
    (item) =>
      item.target === pageTarget(pageId) ||
      hasPage(item.children ?? [], pageId),
  );
}

export function countItems(items: NavItem[]): number {
  return items.reduce(
    (total, item) => total + 1 + (item.children?.length ?? 0),
    0,
  );
}

// Applies `change` to the item with this id, wherever it is.
export function mapItem(
  items: NavItem[],
  id: string,
  change: (item: NavItem) => NavItem | null,
): NavItem[] {
  return items.flatMap((item) => {
    if (item.id === id) {
      const next = change(item);
      return next ? [next] : [];
    }
    return item.children
      ? [{ ...item, children: mapItem(item.children, id, change) }]
      : [item];
  });
}
