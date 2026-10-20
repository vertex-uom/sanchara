import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-office-success-soft text-office-success-text",
  info: "bg-office-tint-blue text-office-ink-blue",
  danger: "bg-office-danger-soft text-office-danger-text",
  neutral: "bg-office-chip text-office-label",
  outline: "border border-border bg-card text-foreground",
} as const;

export type ChipTone = keyof typeof TONES;

type ToneChipProps = {
  tone: ChipTone;
  // A leading icon, or the design-system status dot.
  icon?: LucideIcon;
  dot?: boolean;
  children: ReactNode;
};

// Small status/action pill. The word carries the meaning; colour only reinforces it.
export function ToneChip({ tone, icon: Icon, dot = false, children }: ToneChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium whitespace-nowrap",
        TONES[tone],
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {dot ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
