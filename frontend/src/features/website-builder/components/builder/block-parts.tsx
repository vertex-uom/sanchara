import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { LocalThumbnail } from "../local-thumbnail";

// Shared pieces of the builder's blocks. Colors and fonts come from the
// --site-* CSS variables the canvas sets.

export const sectionClass = "px-6 py-10 @3xl:px-10 @3xl:py-14";
export const titleClass =
  "font-(family-name:--site-heading) text-2xl leading-tight text-(--site-text) @3xl:text-3xl";

// "Name | detail" lines → pairs; blank lines are skipped.
export function lines(value: string | undefined) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split("|");
      return { first: first.trim(), second: rest.join("|").trim() };
    });
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "mb-2 text-[0.65rem] font-semibold tracking-[0.25em] text-(--site-primary) uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SiteButton({
  children,
  outline,
  inverse,
  className,
}: {
  children: ReactNode;
  outline?: boolean;
  // White button on a brand-colored background.
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold",
        inverse
          ? "bg-white text-(--site-primary)"
          : outline
            ? "border-[1.5px] border-(--site-primary) text-(--site-primary)"
            : "bg-(--site-primary) text-(--site-on-primary)",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ContactLine({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-(--site-primary)"
      />
      {children}
    </li>
  );
}

// A picked photo, or a brand-colored stand-in until one is added.
export function Photo({
  file,
  className,
  icon: Icon = ImageIcon,
}: {
  file: File | undefined;
  className: string;
  icon?: LucideIcon;
}) {
  if (file) return <LocalThumbnail file={file} className={className} />;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-(--site-primary)/60 to-(--site-secondary)/75",
        className,
      )}
    >
      <Icon className="size-8 text-white/50" strokeWidth={1.25} />
    </div>
  );
}

// Street map drawing with a pin (no map provider is connected yet).
export function MapSketch({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative min-h-44 overflow-hidden rounded-xl bg-[#e8f1ec]",
        className,
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-[26%] bg-[#cfe6ee]" />
      <div className="absolute inset-x-0 top-[55%] h-2 bg-white" />
      <div className="absolute inset-y-0 left-[40%] w-2 bg-white" />
      <MapPin className="absolute top-[44%] left-1/2 size-8 -translate-x-1/2 -translate-y-full fill-(--site-primary) stroke-white" />
    </div>
  );
}

// Decorative slider arrows and dots (the canvas does not page through photos).
export function SliderControls({ count }: { count: number }) {
  return (
    <>
      {[
        { side: "left-3", Icon: ChevronLeft },
        { side: "right-3", Icon: ChevronRight },
      ].map(({ side, Icon }) => (
        <span
          key={side}
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1f2933] shadow",
            side,
          )}
        >
          <Icon className="size-4" />
        </span>
      ))}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5"
      >
        {Array.from({ length: Math.max(count, 3) }, (_, index) => (
          <span
            key={index}
            className={cn(
              "size-2 rounded-full",
              index ? "bg-white/55" : "bg-white",
            )}
          />
        ))}
      </span>
    </>
  );
}
