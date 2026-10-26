"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { LocalThumbnail } from "../local-thumbnail";
import { NAV_SELECTION, type Builder } from "./builder-state";
import {
  describeTarget,
  itemLabel,
  pageTarget,
  type NavItem,
} from "./nav-model";

type SiteHeaderProps = {
  builder: Builder;
  name: string;
  logo: File | null;
  previewing: boolean;
  sticky: boolean;
};

// The site's top navigation on the canvas. Clicking it (outside a link)
// selects it; links to pages open that page in the builder.
export function SiteHeader({
  builder,
  name,
  logo,
  previewing,
  sticky,
}: SiteHeaderProps) {
  const { nav, site, page } = builder;
  const selected = !previewing && builder.navSelected;
  const items = nav.items.filter((item) => !item.hidden);

  function follow(item: NavItem) {
    const target = describeTarget(item.target, site.pages);
    if (target.page) builder.goToPage(target.page.id);
  }

  const current = (item: NavItem) =>
    item.target === pageTarget(page.id) ||
    Boolean(
      item.children?.some((child) => child.target === pageTarget(page.id)),
    );

  return (
    <header
      onClick={previewing ? undefined : () => builder.select(NAV_SELECTION)}
      className={cn(
        "group/nav relative z-30 flex h-16 items-center gap-4 border-b border-black/5 bg-white px-6 text-[#1f2933] @3xl:px-8",
        sticky && "sticky top-0",
        !previewing &&
          "cursor-pointer outline-offset-[-2px] hover:outline-2 hover:outline-dashed hover:outline-office-chart-bright/70",
        selected && "outline-2 outline-office-chart-bright hover:outline-solid",
      )}
    >
      {previewing ? null : (
        <span
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-10 rounded-br-md bg-office-chart-bright px-2 py-0.5 font-sans text-[0.65rem] font-semibold text-white",
            selected ? "inline-block" : "hidden group-hover/nav:inline-block",
          )}
        >
          Navigation · Global
        </span>
      )}
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
        {items.map((item) => {
          const label = itemLabel(item, site.pages);
          const children =
            item.children?.filter((child) => !child.hidden) ?? [];
          const linkClass = cn(
            "hover:text-(--site-primary)",
            current(item) && "font-semibold text-(--site-primary)",
          );
          if (!children.length) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  follow(item);
                }}
                className={linkClass}
              >
                {label}
              </button>
            );
          }
          const parentPage = describeTarget(item.target, site.pages).page;
          return (
            <div key={item.id} className="group/menu relative">
              <button
                type="button"
                aria-haspopup="true"
                onClick={(event) => event.stopPropagation()}
                className={cn(linkClass, "inline-flex items-center gap-1")}
              >
                {label}
                <ChevronDown aria-hidden="true" className="size-3.5" />
              </button>
              {/* Opens on hover or keyboard focus, like the published menu. */}
              <div className="invisible absolute top-full left-1/2 z-40 w-56 -translate-x-1/2 pt-3 opacity-0 transition-opacity group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
                <ul className="rounded-xl border border-black/5 bg-white p-1.5 shadow-lg">
                  {parentPage ? (
                    <MenuLink
                      label={`All ${label}`}
                      active={parentPage.id === page.id}
                      onClick={() => follow(item)}
                    />
                  ) : null}
                  {children.map((child) => (
                    <MenuLink
                      key={child.id}
                      label={itemLabel(child, site.pages)}
                      active={child.target === pageTarget(page.id)}
                      onClick={() => follow(child)}
                    />
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>
      {nav.cta.show && nav.cta.label.trim() ? (
        <span className="ml-auto inline-flex h-9 shrink-0 items-center rounded-md bg-(--site-primary) px-4 text-xs font-semibold text-(--site-on-primary) @3xl:ml-0">
          {nav.cta.label}
        </span>
      ) : null}
    </header>
  );
}

function MenuLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className={cn(
          "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-(--site-primary)/8",
          active &&
            "bg-(--site-primary)/10 font-semibold text-(--site-primary)",
        )}
      >
        {label}
      </button>
    </li>
  );
}
