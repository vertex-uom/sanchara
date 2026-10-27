import type { ReactNode } from "react";

type StepHeadingProps = { step: number; id?: string; children: ReactNode };

// "① Select units": numbered circle and a bold label, used for each panel step.
export function StepHeading({ step, id, children }: StepHeadingProps) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-sm font-bold text-foreground">
      <span
        aria-hidden="true"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-tropical text-[0.6875rem] font-semibold text-white"
      >
        {step}
      </span>
      <span className="sr-only">Step {step}: </span>
      {children}
    </h3>
  );
}
