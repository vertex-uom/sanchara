import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "../sidebar-modes";

// Form controls from the design system's Input component: 38px tall, radius
// 8, card background, 12.5px text. Labels sit above at 11px.

const CONTROL =
  "focus-ring h-[38px] w-full rounded-md border border-admin-border bg-admin-card text-[12.5px] text-admin-heading placeholder:text-admin-muted-text disabled:cursor-not-allowed disabled:opacity-60";

export function AdminField({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[11px] leading-[14px] font-medium text-admin-muted-text">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AdminInput({ icon: Icon, className, ...props }: ComponentProps<"input"> & { icon?: LucideIcon }) {
  return (
    <div className="relative min-w-0">
      {Icon ? <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted-text" /> : null}
      <input className={cn(CONTROL, Icon ? "pl-9 pr-3" : "px-3", className)} {...props} />
    </div>
  );
}

export function AdminSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative min-w-0">
      <select className={cn(CONTROL, "appearance-none pr-8 pl-3", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" strokeWidth={ICON_STROKE} className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-admin-muted-text" />
    </div>
  );
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "h-auto min-h-24 resize-y px-3 py-2.5 leading-relaxed", className)} {...props} />;
}
