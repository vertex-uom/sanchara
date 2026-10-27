import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ABOUT_ICONS } from "../icons";
import type { AboutIcon, CtaLink } from "../types";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  centred?: boolean;
  // Dark bands use light text.
  inverted?: boolean;
  action?: ReactNode;
};

// Eyebrow, H2 and optional intro used by every /about section.
export function SectionHeading({ id, eyebrow, title, intro, centred = false, inverted = false, action }: SectionHeadingProps) {
  const accent = inverted ? "text-brand-lagoon" : "text-brand-teal";
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", centred && "md:justify-center")}>
      <div className={cn(centred && "mx-auto max-w-2xl text-center")}>
        <p className={cn("flex items-center gap-3 text-xs font-medium tracking-[0.2em] uppercase", accent, centred && "justify-center")}>
          <span aria-hidden="true" className={cn("h-px w-8", inverted ? "bg-brand-lagoon" : "bg-brand-teal")} />
          {eyebrow}
          {centred ? <span aria-hidden="true" className={cn("h-px w-8", inverted ? "bg-brand-lagoon" : "bg-brand-teal")} /> : null}
        </p>
        <h2
          id={id}
          className={cn("mt-3 text-3xl font-semibold tracking-tight sm:text-4xl", inverted ? "text-white" : "text-brand-tropical")}
        >
          {title}
        </h2>
        {intro ? <p className={cn("mt-2", inverted ? "text-white/85" : "text-muted-foreground")}>{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function IconTile({ icon, className }: { icon: AboutIcon; className?: string }) {
  const Icon = ABOUT_ICONS[icon];
  return (
    <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-aqua text-brand-tropical", className)}>
      <Icon className="size-5" />
    </span>
  );
}

const ctaBase =
  "focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-medium transition-colors motion-reduce:transition-none";

const CTA_VARIANTS = {
  primary: "bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal text-white shadow-md",
  // For use on photos and dark bands.
  glass: "glass bg-white/15 text-white hover:bg-white/25",
  outline: "border border-brand-tropical bg-white text-brand-tropical hover:bg-brand-aqua",
};

// Button-styled link. href null = page not built yet (shown as "coming soon").
export function CtaButton({ link, variant }: { link: CtaLink; variant: keyof typeof CTA_VARIANTS }) {
  if (!link.href) {
    return (
      <span aria-disabled="true" title="Coming soon" className={cn(ctaBase, CTA_VARIANTS[variant], "cursor-not-allowed opacity-70")}>
        {link.label}
        <span className="sr-only"> (coming soon)</span>
      </span>
    );
  }
  return (
    <Link href={link.href} className={cn(ctaBase, CTA_VARIANTS[variant], "group")}>
      {link.label}
      {variant === "primary" ? (
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      ) : null}
    </Link>
  );
}

// Plain text link with the same "coming soon" fallback.
export function TextLink({ link, className }: { link: CtaLink; className?: string }) {
  if (!link.href) {
    return (
      <span aria-disabled="true" title="Coming soon" className={cn("cursor-not-allowed opacity-70", className)}>
        {link.label}
        <span className="sr-only"> (coming soon)</span>
      </span>
    );
  }
  return (
    <Link href={link.href} className={cn("focus-ring rounded-sm underline-offset-4 hover:underline", className)}>
      {link.label}
    </Link>
  );
}
