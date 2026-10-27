"use client";

import { useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { IslandMap, type MapDestination } from "../island-map";
import "./destination-explorer.css";

export type ExplorerDestination = MapDestination & { imageUrl: string };

// Shared by a tile's photo and the panel photo, so a view transition morphs
// one into the other. Only one element carries it at a time.
const PHOTO_TRANSITION = "destination-photo";

function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

// Swaps the transition name from one photo to the other inside a view
// transition. `to` is looked up after the update, since it may only exist
// then. Without support (or with reduced motion) it just updates.
function morph(from: HTMLElement | null | undefined, to: () => HTMLElement | null | undefined, update: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced || !from) {
    update();
    return;
  }
  from.style.viewTransitionName = PHOTO_TRANSITION;
  let target: HTMLElement | null | undefined;
  const transition = document.startViewTransition(() => {
    from.style.viewTransitionName = "";
    update();
    target = to();
    if (target) target.style.viewTransitionName = PHOTO_TRANSITION;
  });
  transition.finished.finally(() => {
    if (target) target.style.viewTransitionName = "";
  });
}

// Destination tiles that open into the 3D island map: the photo morphs into
// the side panel and the camera flies to the destination's pin. Tiles are
// links to the destination's stays, so without JavaScript (or with a
// modified click) they go straight there.
export function DestinationExplorer({ destinations }: { destinations: ExplorerDestination[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const panelPhotoRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? null : destinations[active];
  const count = destinations.length;

  const tilePhoto = (index: number) => tileRefs.current[index]?.querySelector("img");

  const open = (index: number) => {
    morph(tilePhoto(index), () => panelPhotoRef.current, () => {
      flushSync(() => setActive(index));
      dialogRef.current?.showModal();
      // showModal() focuses the first map label; start on Close instead.
      closeRef.current?.focus();
    });
  };

  // Morphs back into the tile of the destination now on show.
  const close = () => {
    if (active === null) return;
    const index = active;
    morph(panelPhotoRef.current, () => tilePhoto(index), () => {
      dialogRef.current?.close();
      flushSync(() => setActive(null));
    });
  };

  const step = (by: number) => setActive((index) => (index === null ? index : (index + by + count) % count));

  return (
    <>
      <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {destinations.map((destination, index) => (
          <li key={destination.name}>
            <article
              ref={(node) => {
                tileRefs.current[index] = node;
              }}
              className="group relative isolate grid overflow-hidden rounded-3xl shadow-sm"
            >
              <RemoteImage
                src={destination.imageUrl}
                alt={`${destination.name}, ${destination.region}`}
                width={800}
                height={1000}
                className="col-start-1 row-start-1 aspect-4/5 w-full bg-brand-aqua object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
              {/* Not positioned, so the link's ::after below stretches over the whole tile. */}
              <div className="z-10 col-start-1 row-start-1 self-end p-4 text-white sm:p-5">
                <h3 className="text-xl font-semibold sm:text-2xl">{destination.name}</h3>
                <p className="text-sm text-white/85">{destination.region}</p>
                <Link
                  href={destination.href}
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    if (!isPlainClick(event)) return;
                    event.preventDefault();
                    open(index);
                  }}
                  className="focus-ring mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-medium after:absolute after:inset-0 after:content-['']"
                >
                  Explore on the map
                  <span className="sr-only">: {destination.name}</span>
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby="destination-explorer-title"
        className="destination-explorer"
        onCancel={(event) => {
          // Esc: close with the morph instead of the instant default.
          event.preventDefault();
          close();
        }}
        onClose={() => setActive(null)}
      >
        {current && active !== null ? (
          <div className="grid h-full grid-rows-[minmax(0,55fr)_minmax(0,45fr)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-1">
            <div className="relative min-h-0 bg-linear-to-br from-brand-tropical via-brand-deep-teal to-brand-tropical">
              <IslandMap destinations={destinations} focusIndex={active} onSelect={setActive} sizeClassName="h-full" />
            </div>

            <aside className="overflow-y-auto bg-brand-cream p-5 text-brand-tropical sm:p-6 lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-[0.2em] text-brand-teal uppercase">
                  Featured destination · {active + 1} of {count}
                </p>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="focus-ring flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-tropical shadow transition-colors hover:bg-brand-aqua motion-reduce:transition-none"
                >
                  <X aria-hidden="true" className="size-5" />
                  <span className="sr-only">Close map</span>
                </button>
              </div>

              <RemoteImage
                ref={panelPhotoRef}
                src={current.imageUrl}
                alt={`${current.name}, ${current.region}`}
                width={800}
                height={1000}
                priority
                className="mt-4 aspect-video w-full rounded-3xl bg-brand-aqua object-cover lg:aspect-4/3"
              />

              <div aria-live="polite" className="mt-5">
                <h2 id="destination-explorer-title" className="text-3xl font-semibold tracking-tight">
                  {current.name}
                </h2>
                <p className="mt-1 text-muted-foreground">{current.region}</p>
              </div>

              <Link
                href={current.href}
                className="focus-ring group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-6 text-sm font-medium text-white shadow-md"
              >
                Browse stays in {current.name}
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>

              <nav aria-label="Other destinations" className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { by: -1, Icon: ArrowLeft, label: "Previous" },
                  { by: 1, Icon: ArrowRight, label: "Next" },
                ].map(({ by, Icon, label }) => {
                  const target = destinations[(active + by + count) % count];
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => step(by)}
                      className="focus-ring flex min-h-11 items-center gap-2 rounded-2xl border border-brand-lagoon/60 bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-brand-aqua motion-reduce:transition-none data-[next]:flex-row-reverse data-[next]:text-right"
                      data-next={by > 0 ? "" : undefined}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">{label}</span>
                        <span className="block truncate font-semibold">{target.name}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
