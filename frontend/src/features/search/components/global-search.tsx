"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, LoaderCircle, Search, UserRound, X, type LucideIcon } from "lucide-react";
import { formatDateOnly, formatDayMonth } from "@/lib/format/dates";
import { formatMoney } from "@/lib/format/money";
import { propertyPath } from "@/lib/routes/backoffice";
import { ToneChip } from "@/components/ui/tone-chip";
import { cn } from "@/lib/utils";
import { searchAction } from "../actions";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH, STATUS_META } from "../config";
import type { GuestHit, ReservationHit, SearchResults } from "../types";

type Status = "idle" | "loading" | "done" | "error";

type Option =
  | { kind: "reservation"; href: string; hit: ReservationHit }
  | { kind: "guest"; href: string; hit: GuestHit };

function toOptions(propertyId: string, results: SearchResults | null): Option[] {
  if (!results) return [];
  return [
    ...results.reservations.map((hit) => ({
      kind: "reservation" as const,
      href: propertyPath(propertyId, `reservations/${encodeURIComponent(hit.id)}`),
      hit,
    })),
    ...results.guests.map((hit) => ({
      kind: "guest" as const,
      href: propertyPath(propertyId, `guests?q=${encodeURIComponent(hit.fullName)}`),
      hit,
    })),
  ];
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function announcement(status: Status, query: string, results: SearchResults | null) {
  if (status === "loading") return "Searching…";
  if (status === "error") return "Search isn't available right now.";
  if (status !== "done" || !results) return "";
  const { reservations, guests } = results;
  if (reservations.length + guests.length === 0) return `No matches for ${query}.`;
  return `${plural(reservations.length, "reservation")} and ${plural(guests.length, "guest")} found.`;
}

// True when a key press is meant for a text field, not a page shortcut.
function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

// Header search for the current property: reservations by reference or guest
// name, guests by name, phone or email. "/" or Ctrl+K focuses it.
// ARIA combobox: focus stays in the input, arrows move the active option.
export function GlobalSearch({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestRequest = useRef(0);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [active, setActive] = useState(-1);

  const options = toOptions(propertyId, results);
  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= SEARCH_MIN_LENGTH && status !== "idle";
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const shortcut = (event.key === "/" && !isTyping(event.target)) || (event.key === "k" && (event.ctrlKey || event.metaKey));
      if (!shortcut) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer.current);
    };
  }, []);

  async function run(text: string) {
    const request = ++latestRequest.current;
    try {
      const found = await searchAction(propertyId, text);
      if (request !== latestRequest.current) return;
      setResults(found);
      setStatus("done");
    } catch {
      if (request !== latestRequest.current) return;
      setResults(null);
      setStatus("error");
    }
  }

  function change(value: string) {
    setQuery(value);
    setOpen(true);
    setActive(-1);
    clearTimeout(timer.current);
    latestRequest.current++;
    const text = value.trim();
    if (text.length < SEARCH_MIN_LENGTH) {
      setResults(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(() => run(text), SEARCH_DEBOUNCE_MS);
  }

  function clear() {
    change("");
    inputRef.current?.focus();
  }

  function go(option: Option) {
    setOpen(false);
    setActive(-1);
    router.push(option.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = options.length;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        setOpen(true);
        if (!count) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((current) => (current === -1 && step === -1 ? count - 1 : (current + step + count) % count));
        return;
      }
      case "Home":
      case "End":
        if (!showPanel || active === -1 || !count) return;
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : count - 1);
        return;
      case "Enter": {
        const option = options[active === -1 ? 0 : active];
        if (!showPanel || !option) return;
        event.preventDefault();
        go(option);
        return;
      }
      case "Escape":
        event.preventDefault();
        if (showPanel) {
          setOpen(false);
          setActive(-1);
        } else if (query) {
          clear();
        } else {
          inputRef.current?.blur();
        }
        return;
    }
  }

  return (
    <div
      role="search"
      className="relative mx-auto hidden w-full max-w-md lg:block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Search reservations and guests
      </label>
      <div className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:border-office-primary focus-within:ring-2 focus-within:ring-office-primary/20">
        <Search aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-activedescendant={showPanel && active !== -1 ? optionId(active) : undefined}
          aria-keyshortcuts="/ Control+K"
          value={query}
          onChange={(event) => change(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search reservations, guests…"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {status === "loading" ? (
          <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin text-office-icon motion-reduce:animate-none" />
        ) : null}
        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="focus-ring -mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-office-icon hover:bg-office-nav-active"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {showPanel ? announcement(status, trimmed, results) : ""}
      </p>

      {/* Mouse down on the panel must not blur the input. */}
      <div
        hidden={!showPanel}
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-x-0 top-full z-40 mt-2 max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
      >
        <ul id={listboxId} role="listbox" aria-label="Search results">
          <ResultGroup id={`${listboxId}-reservations`} label="Reservations" show={!!results?.reservations.length}>
            {options.map((option, index) =>
              option.kind === "reservation" ? (
                <OptionRow key={option.hit.id} id={optionId(index)} option={option} active={index === active} onHover={() => setActive(index)} onSelect={() => go(option)}>
                  <ReservationRow hit={option.hit} />
                </OptionRow>
              ) : null,
            )}
          </ResultGroup>
          <ResultGroup id={`${listboxId}-guests`} label="Guests" show={!!results?.guests.length}>
            {options.map((option, index) =>
              option.kind === "guest" ? (
                <OptionRow key={option.hit.id} id={optionId(index)} option={option} active={index === active} onHover={() => setActive(index)} onSelect={() => go(option)}>
                  <GuestRow hit={option.hit} />
                </OptionRow>
              ) : null,
            )}
          </ResultGroup>
        </ul>
        <PanelMessage status={status} query={trimmed} empty={options.length === 0} />
      </div>
    </div>
  );
}

function ResultGroup({ id, label, show, children }: { id: string; label: string; show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <li role="presentation">
      <p id={id} className="px-2.5 pt-2 pb-1 text-xs font-medium tracking-wide text-office-muted uppercase">
        {label}
      </p>
      <ul role="group" aria-labelledby={id}>
        {children}
      </ul>
    </li>
  );
}

type OptionRowProps = { id: string; option: Option; active: boolean; onHover: () => void; onSelect: () => void; children: ReactNode };

// A real link so middle-click and "open in new tab" still work; plain clicks
// go through onSelect to close the panel first.
function OptionRow({ id, option, active, onHover, onSelect, children }: OptionRowProps) {
  const Icon: LucideIcon = option.kind === "reservation" ? CalendarDays : UserRound;
  return (
    <li role="presentation">
      <Link
        id={id}
        href={option.href}
        role="option"
        aria-selected={active}
        tabIndex={-1}
        onMouseMove={active ? undefined : onHover}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onSelect();
        }}
        className={cn("flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-2 outline-none", active && "bg-office-nav-active")}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            option.kind === "reservation" ? "bg-office-tint-teal text-office-primary" : "bg-office-tint-violet text-office-ink-violet",
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </Link>
    </li>
  );
}

function ReservationRow({ hit }: { hit: ReservationHit }) {
  const status = STATUS_META[hit.status];
  return (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          #{hit.reference} · {hit.guestName}
        </span>
        <ToneChip tone={status.tone}>{status.label}</ToneChip>
      </span>
      <span className="block truncate text-xs text-office-muted">
        {hit.unitLabel} · {formatDayMonth(hit.checkIn)} – {formatDateOnly(hit.checkOut)} · {formatMoney(hit.total)}
      </span>
    </>
  );
}

function GuestRow({ hit }: { hit: GuestHit }) {
  const contact = [hit.phone, hit.email].filter(Boolean).join(" · ") || "No contact details";
  return (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">{hit.fullName}</span>
        <span className="shrink-0 text-xs text-office-muted">{plural(hit.stays, "stay")}</span>
      </span>
      <span className="block truncate text-xs text-office-muted">{contact}</span>
    </>
  );
}

function PanelMessage({ status, query, empty }: { status: Status; query: string; empty: boolean }) {
  if (status === "error") {
    return <p className="px-2.5 py-3 text-sm text-office-danger-text">Search isn&apos;t available right now. Try again in a moment.</p>;
  }
  if (!empty) return null;
  if (status === "loading") return <p className="px-2.5 py-3 text-sm text-office-muted">Searching…</p>;
  return (
    <div className="px-2.5 py-3 text-sm">
      <p className="font-medium text-foreground">No matches for “{query}”</p>
      <p className="mt-0.5 text-office-muted">Try a booking reference like 58K-1042, a guest name, phone number or email.</p>
    </div>
  );
}
