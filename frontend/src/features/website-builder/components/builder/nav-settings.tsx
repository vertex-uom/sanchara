"use client";

import { useState, type DragEvent } from "react";
import {
  CornerDownRight,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { inputClass, Switch } from "../template-fields";
import type { Builder } from "./builder-state";
import {
  BOOKING_TARGET,
  countItems,
  describeTarget,
  itemLabel,
  mapItem,
  pageTarget,
  type NavItem,
} from "./nav-model";

const NAV_DRAG = "application/x-sanchara-nav-";
const CUSTOM = "url:";

// Right panel when the site navigation is selected: menu items (reorder,
// rename, link, hide, sub-items) and the call-to-action button.
export function NavSettings({ builder }: { builder: Builder }) {
  const { nav, site } = builder;
  const [editing, setEditing] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const setItems = (items: NavItem[], mergeKey?: string) =>
    builder.updateNav({ ...nav, items }, mergeKey);
  const change = (id: string, patch: Partial<NavItem>, mergeKey?: string) =>
    setItems(
      mapItem(nav.items, id, (item) => ({ ...item, ...patch })),
      mergeKey ? `${id}:${mergeKey}` : undefined,
    );

  function addItem(parentId?: string) {
    const item: NavItem = {
      id: crypto.randomUUID(),
      label: "",
      target: pageTarget(site.pages[0].id),
    };
    setItems(
      parentId
        ? mapItem(nav.items, parentId, (parent) => ({
            ...parent,
            children: [...(parent.children ?? []), item],
          }))
        : [...nav.items, item],
    );
    setEditing(item.id);
  }

  function indexAt(event: DragEvent<HTMLOListElement>) {
    const rows = [
      ...event.currentTarget.querySelectorAll<HTMLElement>("[data-nav-index]"),
    ];
    const hit = rows.find((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    return hit ? Number(hit.dataset.navIndex) : nav.items.length;
  }

  function dragId(event: DragEvent) {
    const type = [...event.dataTransfer.types].find((item) =>
      item.startsWith(NAV_DRAG),
    );
    return type?.slice(NAV_DRAG.length) ?? null;
  }

  function handleDrop(event: DragEvent<HTMLOListElement>) {
    event.preventDefault();
    const id = dragId(event);
    const to = indexAt(event);
    setDropIndex(null);
    const from = nav.items.findIndex((item) => item.id === id);
    if (from < 0) return;
    const items = [...nav.items];
    const [moved] = items.splice(from, 1);
    items.splice(to > from ? to - 1 : to, 0, moved);
    setItems(items);
  }

  const line = (
    <div
      aria-hidden="true"
      className="mb-1.5 h-0.5 rounded-full bg-office-chart-bright"
    />
  );

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-office-icon">
            Navigation Menu
          </h2>
          <p className="text-xs text-office-muted">Shown on every page</p>
        </div>
        <button
          type="button"
          aria-label="Close navigation settings"
          onClick={() => builder.select(null)}
          className="focus-ring inline-flex size-8 items-center justify-center rounded-md text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <section aria-labelledby="menu-items-title">
        <div className="mb-2 flex items-center justify-between">
          <h3
            id="menu-items-title"
            className="text-sm font-semibold text-office-icon"
          >
            Menu items
          </h3>
          <span className="text-xs text-office-muted">
            {countItems(nav.items)} items
          </span>
        </div>
        <ol
          onDragOver={(event) => {
            if (!dragId(event)) return;
            event.preventDefault();
            setDropIndex(indexAt(event));
          }}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setDropIndex(null);
          }}
          onDrop={handleDrop}
          className="flex flex-col gap-1.5"
        >
          {nav.items.map((item, index) => (
            <li key={item.id}>
              {dropIndex === index ? line : null}
              <ItemRow
                item={item}
                builder={builder}
                index={index}
                editing={editing === item.id}
                onEdit={() => setEditing(editing === item.id ? null : item.id)}
                onChange={change}
                onAddChild={() => addItem(item.id)}
                onRemove={() =>
                  setItems(mapItem(nav.items, item.id, () => null))
                }
              />
              {item.children?.length ? (
                <ol className="mt-1.5 flex flex-col gap-1.5 pl-5">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <ItemRow
                        item={child}
                        builder={builder}
                        child
                        editing={editing === child.id}
                        onEdit={() =>
                          setEditing(editing === child.id ? null : child.id)
                        }
                        onChange={change}
                        onRemove={() =>
                          setItems(mapItem(nav.items, child.id, () => null))
                        }
                      />
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
          {dropIndex === nav.items.length ? <li>{line}</li> : null}
        </ol>
        <button
          type="button"
          onClick={() => addItem()}
          className="focus-ring mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-office-primary/60 text-sm font-semibold text-office-primary hover:bg-office-tint-teal"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add menu item
        </button>
      </section>

      <section
        aria-labelledby="menu-cta-title"
        className="flex flex-col gap-3 border-t border-office-meter-track pt-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            id="menu-cta-title"
            className="text-sm font-semibold text-office-icon"
          >
            Call-to-action button
          </h3>
          <Switch
            aria-label="Show the call-to-action button"
            checked={nav.cta.show}
            onChange={(show) =>
              builder.updateNav({ ...nav, cta: { ...nav.cta, show } })
            }
          />
        </div>
        {nav.cta.show ? (
          <>
            <div>
              <label
                htmlFor="nav-cta-label"
                className="mb-1.5 block text-xs font-medium text-office-muted"
              >
                Button text
              </label>
              <input
                id="nav-cta-label"
                maxLength={24}
                value={nav.cta.label}
                onChange={(event) =>
                  builder.updateNav(
                    { ...nav, cta: { ...nav.cta, label: event.target.value } },
                    "cta-label",
                  )
                }
                className={inputClass}
              />
            </div>
            <TargetPicker
              id="nav-cta-target"
              builder={builder}
              value={nav.cta.target}
              onChange={(target, mergeKey) =>
                builder.updateNav(
                  { ...nav, cta: { ...nav.cta, target } },
                  mergeKey,
                )
              }
            />
          </>
        ) : null}
      </section>
    </div>
  );
}

type ItemRowProps = {
  item: NavItem;
  builder: Builder;
  index?: number;
  child?: boolean;
  editing: boolean;
  onEdit: () => void;
  onChange: (id: string, patch: Partial<NavItem>, mergeKey?: string) => void;
  onAddChild?: () => void;
  onRemove: () => void;
};

function ItemRow({
  item,
  builder,
  index,
  child,
  editing,
  onEdit,
  onChange,
  onAddChild,
  onRemove,
}: ItemRowProps) {
  const pages = builder.site.pages;
  const name = itemLabel(item, pages);
  const detail = item.children?.length
    ? `Dropdown · ${item.children.length} ${item.children.length === 1 ? "link" : "links"}`
    : describeTarget(item.target, pages).detail;

  return (
    <div
      data-nav-index={child ? undefined : index}
      draggable={!child && !editing}
      onDragStart={(event) => {
        event.dataTransfer.setData(`${NAV_DRAG}${item.id}`, item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-xl border bg-card",
        editing ? "border-brand-cyan" : "border-office-meter-track",
        item.hidden && "opacity-60",
      )}
    >
      <div className="flex items-center gap-1.5 py-1.5 pr-1.5 pl-1.5">
        {child ? (
          <CornerDownRight
            aria-hidden="true"
            className="size-4 shrink-0 text-office-muted/70"
          />
        ) : (
          <GripVertical
            aria-hidden="true"
            className="size-4 shrink-0 cursor-grab text-office-muted/60"
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-office-icon">
            {name}
          </span>
          {child ? null : (
            <span className="block truncate text-xs text-office-muted">
              {detail}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label={`Edit ${name}`}
          aria-expanded={editing}
          onClick={onEdit}
          className="focus-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-office-chip hover:text-office-icon"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={item.hidden ? `Show ${name}` : `Hide ${name}`}
          aria-pressed={Boolean(item.hidden)}
          onClick={() => onChange(item.id, { hidden: !item.hidden })}
          className="focus-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md text-office-muted hover:bg-office-chip hover:text-office-icon"
        >
          {item.hidden ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3 border-t border-office-meter-track p-3">
          <div>
            <label
              htmlFor={`nav-${item.id}-label`}
              className="mb-1.5 block text-xs font-medium text-office-muted"
            >
              Label
            </label>
            <input
              id={`nav-${item.id}-label`}
              maxLength={30}
              value={item.label}
              placeholder={describeTarget(item.target, pages).label}
              onChange={(event) =>
                onChange(item.id, { label: event.target.value }, "label")
              }
              className={inputClass}
            />
          </div>
          <TargetPicker
            id={`nav-${item.id}-target`}
            builder={builder}
            value={item.target}
            onChange={(target, mergeKey) =>
              onChange(item.id, { target }, mergeKey)
            }
          />
          <div className="flex flex-wrap gap-2">
            {onAddChild ? (
              <Button
                type="button"
                variant="outline"
                onClick={onAddChild}
                className="h-9 gap-1.5 border-office-meter-track bg-card text-sm font-medium text-office-icon hover:bg-office-chip"
              >
                <Plus aria-hidden="true" className="size-4" />
                Add sub-item
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onRemove}
              className="h-9 gap-1.5 border-office-meter-track bg-card text-sm font-medium text-office-danger-text hover:bg-office-danger-soft"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Link target: a page, the booking section, or a web address.
function TargetPicker({
  id,
  builder,
  value,
  onChange,
}: {
  id: string;
  builder: Builder;
  value: string;
  onChange: (target: string, mergeKey?: string) => void;
}) {
  const custom = value.startsWith(CUSTOM);
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-office-muted"
      >
        Link to
      </label>
      <select
        id={id}
        value={custom ? CUSTOM : value}
        onChange={(event) =>
          onChange(
            event.target.value === CUSTOM
              ? `${CUSTOM}https://`
              : event.target.value,
          )
        }
        className={cn(inputClass, "cursor-pointer")}
      >
        {builder.site.pages.map((page) => (
          <option key={page.id} value={pageTarget(page.id)}>
            {page.name} ({page.path})
          </option>
        ))}
        <option value={BOOKING_TARGET}>Booking section</option>
        <option value={CUSTOM}>Web address…</option>
      </select>
      {custom ? (
        <input
          aria-label="Web address"
          type="url"
          value={value.slice(CUSTOM.length)}
          onChange={(event) =>
            onChange(`${CUSTOM}${event.target.value}`, `${id}-url`)
          }
          placeholder="https://"
          className={inputClass}
        />
      ) : null}
    </div>
  );
}
