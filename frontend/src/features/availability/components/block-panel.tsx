"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog } from "radix-ui";
import { CalendarX2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FOCUS_SCOPE } from "@/components/ui/focus-scope";

// From this width the panel docks beside the results. Below it, it's a
// right-side drawer (tablet) or a full-screen bottom sheet (phone).
const DESKTOP_QUERY = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type BlockPanelState = {
  open: boolean;
  // null until the user opens or closes it: then open on desktop only.
  choice: boolean | null;
  // Docked beside the results (true) or a modal drawer / sheet (false).
  docked: boolean;
  toggle: () => void;
  close: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
};

const BlockPanelContext = createContext<BlockPanelState | null>(null);

export function useBlockPanel() {
  const state = useContext(BlockPanelContext);
  if (!state) throw new Error("useBlockPanel must be used inside BlockPanelLayout");
  return state;
}

type BlockPanelLayoutProps = {
  // Hides the panel entirely and renders only the main column.
  enabled: boolean;
  panel: ReactNode;
  children: ReactNode;
};

// Owns the Block dates panel's open state. The main column takes the full
// width when the docked panel is closed.
export function BlockPanelLayout({ enabled, panel, children }: BlockPanelLayoutProps) {
  const docked = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? docked;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Docked panel only: where focus goes after the next open/close. The
  // drawer and sheet move and return focus themselves.
  const pendingFocus = useRef<"heading" | "button" | null>(null);

  useEffect(() => {
    const target = pendingFocus.current === "heading" ? headingRef.current : pendingFocus.current === "button" ? buttonRef.current : null;
    pendingFocus.current = null;
    target?.focus();
  }, [choice]);

  if (!enabled) return <div className="min-w-0">{children}</div>;

  const state: BlockPanelState = {
    open,
    choice,
    docked,
    toggle: () => {
      if (docked) pendingFocus.current = open ? "button" : "heading";
      setChoice(!open);
    },
    close: () => {
      pendingFocus.current = "button";
      setChoice(false);
    },
    buttonRef,
    headingRef,
  };

  // Before any user choice, CSS decides so the server render is right on every screen.
  return (
    <BlockPanelContext.Provider value={state}>
      <div className={cn("grid items-start gap-5", choice !== false && "xl:grid-cols-[minmax(0,1fr)_21.25rem]")}>
        <div className="min-w-0">{children}</div>
        {panel}
      </div>
    </BlockPanelContext.Provider>
  );
}

// Outlined "Block dates" button in the page header; opens and closes the panel.
export function BlockDatesButton() {
  const { open, toggle, buttonRef } = useBlockPanel();
  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      aria-expanded={open}
      aria-controls="block-dates-panel"
      onClick={toggle}
      className="focus-ring focus-visible:ring-0 h-11 gap-2 rounded-lg border-border bg-card px-4 text-sm font-semibold text-brand-tropical hover:bg-office-chip aria-expanded:bg-card aria-expanded:text-brand-tropical md:h-10"
    >
      <CalendarX2 aria-hidden="true" className="size-4" />
      Block dates
    </Button>
  );
}

function PanelHeader({ title }: { title: ReactNode }) {
  const { close } = useBlockPanel();
  return (
    <div className="flex items-center justify-between gap-2">
      {title}
      <button
        type="button"
        onClick={close}
        aria-label="Close block dates"
        className="focus-ring inline-flex size-11 items-center justify-center rounded-md text-office-icon hover:bg-office-chip md:size-8"
      >
        <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

const TITLE_CLASS = "text-lg font-bold text-foreground outline-none";

// The Block dates panel; the form goes in as children. Docked white card
// with its own scroll on desktop; a modal drawer or sheet below that, with
// focus trapped inside and Escape to close.
export function BlockPanel({ children }: { children?: ReactNode }) {
  const { open, choice, docked, close, headingRef } = useBlockPanel();

  if (docked) {
    const visibility = choice === null ? "hidden xl:flex" : choice ? "flex" : "hidden";
    return (
      <aside
        id="block-dates-panel"
        aria-labelledby="block-dates-title"
        className={cn(
          "flex-col rounded-[16px] border border-border bg-card p-4 xl:sticky xl:top-22 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto",
          visibility,
        )}
      >
        <PanelHeader
          title={
            <h2 id="block-dates-title" ref={headingRef} tabIndex={-1} className={TITLE_CLASS}>
              Block dates
            </h2>
          }
        />
        <div className="mt-4 flex flex-col gap-5">{children}</div>
      </aside>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          id="block-dates-panel"
          aria-describedby={undefined}
          // Start on the title so the steps read in order.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          className={cn(
            FOCUS_SCOPE,
            "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-card p-4 shadow-xl",
            "md:left-auto md:w-88 md:max-w-[90vw] md:border-l md:border-border",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-right motion-reduce:animate-none",
          )}
        >
          <PanelHeader
            title={
              <Dialog.Title id="block-dates-title" ref={headingRef} tabIndex={-1} className={TITLE_CLASS}>
                Block dates
              </Dialog.Title>
            }
          />
          <div className="mt-4 flex flex-col gap-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
