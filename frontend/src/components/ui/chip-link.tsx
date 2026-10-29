import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ChipLinkProps = Omit<ComponentProps<typeof Link>, "aria-current"> & {
  active: boolean;
  // md: tabs and staff filters; sm: the reports date-range chips.
  size?: "sm" | "md";
  // "page" for navigation tabs, "true" for a selected filter.
  current?: "page" | "true";
  // Unselected look: filled grey, or white with a border (audit categories).
  variant?: "filled" | "outline";
};

// Filter chip or tab that changes the URL. Phones get 44px touch targets.
export function ChipLink({ active, size = "md", current = "true", variant = "filled", className, ...props }: ChipLinkProps) {
  return (
    <Link
      scroll={false}
      aria-current={active ? current : undefined}
      className={cn(
        "focus-ring inline-flex h-11 items-center rounded-md font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
        size === "md" ? "px-4 text-[0.9375rem] md:h-8.75 md:px-5" : "px-3 text-sm md:h-7",
        variant === "outline" && "gap-2 border",
        active
          ? "border-transparent bg-office-primary text-white"
          : variant === "outline"
            ? "border-border bg-card text-foreground hover:bg-office-chip"
            : "bg-office-chip text-foreground hover:bg-office-pill",
        className,
      )}
      {...props}
    />
  );
}
