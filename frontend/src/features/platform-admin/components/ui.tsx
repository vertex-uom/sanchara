import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "../sidebar-modes";
import type { Tone } from "../types";

// Building blocks for Platform Admin dashboard cards, from the Figma design
// system (Card, Status Chip, Link, Button/Primary, Button/Secondary).

export function AdminCard({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-[14px] border border-admin-border bg-admin-card p-5", className)} {...props} />;
}

// Icon + title, optional chip, and a trailing action, e.g. a "View all" link.
export function AdminCardHeader({
  id,
  icon: Icon,
  title,
  chip,
  action,
  className,
}: {
  id: string;
  icon?: LucideIcon;
  title: string;
  chip?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3.5 flex min-h-6 flex-wrap items-center gap-2.5", className)}>
      {Icon ? <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 shrink-0 text-admin-icon" /> : null}
      <h2 id={id} className="text-base font-semibold text-admin-heading">
        {title}
      </h2>
      {chip}
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

const TONE_CHIP: Record<Tone, string> = {
  success: "bg-admin-success-soft text-admin-success",
  warning: "bg-admin-warning-soft text-admin-warning",
  danger: "bg-admin-danger-soft text-admin-danger",
  info: "bg-admin-info-soft text-admin-info",
  neutral: "bg-admin-muted text-admin-muted-text",
};

// Status Chip: 11px Medium, 8/4 padding, radius 6. `dot` adds the leading dot.
export function AdminChip({ tone, dot = false, className, children }: { tone: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] leading-none font-medium whitespace-nowrap", TONE_CHIP[tone], className)}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

// "View all →" link. srContext names the target for screen readers.
export function AdminLink({ href, children, srContext }: { href: string; children: ReactNode; srContext?: string }) {
  return (
    <Link href={href} className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline sm:min-h-0">
      {children}
      {srContext ? <span className="sr-only"> {srContext}</span> : null}
      <ArrowRight aria-hidden="true" strokeWidth={ICON_STROKE} className="size-3.5 shrink-0" />
    </Link>
  );
}

const BUTTON_VARIANT = {
  primary: "bg-admin-primary text-white hover:bg-admin-primary/90",
  secondary: "border border-admin-border bg-admin-card text-admin-heading hover:bg-admin-muted",
  danger: "bg-admin-danger text-white hover:bg-admin-danger/90",
} as const;

export type AdminButtonVariant = keyof typeof BUTTON_VARIANT;

// Button/Primary, Button/Secondary and Button/Danger: 12.5px Medium, 12/7
// padding, radius 8, 18px leading icon. Shared by the link and button forms.
export function adminButtonClass(variant: AdminButtonVariant, className?: string) {
  return cn(
    "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-1.75 text-[12.5px] font-medium whitespace-nowrap transition-colors motion-reduce:transition-none sm:min-h-0",
    BUTTON_VARIANT[variant],
    className,
  );
}

export function AdminButtonLink({
  href,
  icon: Icon,
  variant = "secondary",
  className,
  children,
}: {
  href: string;
  icon: LucideIcon;
  variant?: AdminButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={adminButtonClass(variant, className)}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4.5 shrink-0" />
      {children}
    </Link>
  );
}

// Same visual as AdminButtonLink, as a <button>. `placeholder` renders the
// button inert (aria-disabled) with a "(coming soon)" note for screen readers;
// used while the action behind it is not wired to the API yet.
export function AdminButton({
  icon: Icon,
  variant = "secondary",
  placeholder = false,
  className,
  children,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  icon?: LucideIcon;
  variant?: AdminButtonVariant;
  placeholder?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-disabled={placeholder || undefined}
      className={adminButtonClass(variant, cn(placeholder && "cursor-default", className))}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4.5 shrink-0" /> : null}
      {children}
      {placeholder ? <span className="sr-only"> (coming soon)</span> : null}
    </button>
  );
}

export function AdminSkeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-admin-muted motion-reduce:animate-none", className)} />;
}
