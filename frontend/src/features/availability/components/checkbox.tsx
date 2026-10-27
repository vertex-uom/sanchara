"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  // "Some selected": shown as a dash and announced as mixed.
  indeterminate?: boolean;
};

// Native checkbox in the brand colour, with an indeterminate state.
export function Checkbox({ indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn("focus-ring size-4 shrink-0 cursor-pointer rounded accent-brand-tropical", className)}
      {...props}
    />
  );
}
