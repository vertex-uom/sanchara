"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DESKTOP = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type UrlDialogProps = { title: string; closeHref: string; variant: "panel" | "dialog"; children: ReactNode };

// Dialog opened by the URL (?panel=…); closing (Escape, ✕, Cancel) replaces the URL.
// Radix moves focus in, traps it while modal and returns it on close.
// "panel" is the design's side column from xl (non-modal) and a full-screen sheet below.
export function UrlDialog({ title, closeHref, variant, children }: UrlDialogProps) {
  const router = useRouter();
  const isDesktop = useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => true);
  const inline = variant === "panel" && isDesktop;

  const content = (
    <Dialog.Content
      aria-describedby={undefined}
      // The side column stays open while the user works with the table.
      onInteractOutside={(event) => {
        if (inline) event.preventDefault();
      }}
      className={cn(
        "relative bg-card p-5",
        inline && "w-[22rem] shrink-0 rounded-xl border border-border xl:sticky xl:top-20",
        variant === "panel" && !inline && "fixed inset-0 z-50 overflow-y-auto",
        variant === "dialog" &&
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border shadow-xl",
      )}
    >
      <Dialog.Title className="mb-5 pr-12 text-xl font-semibold">{title}</Dialog.Title>
      {children}
      {/* Last in the DOM so focus starts on the first field, first on screen visually. */}
      <Dialog.Close
        aria-label={`Close ${title.toLowerCase()}`}
        className="focus-ring absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-lg text-office-icon transition-colors hover:bg-office-chip motion-reduce:transition-none"
      >
        <X aria-hidden="true" className="size-5" />
      </Dialog.Close>
    </Dialog.Content>
  );

  return (
    <Dialog.Root
      open
      modal={!inline}
      onOpenChange={(open) => {
        if (!open) router.replace(closeHref, { scroll: false });
      }}
    >
      {inline ? (
        content
      ) : (
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40" />
          {content}
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
