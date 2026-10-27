import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  FORM_STEP_COUNT,
  TEMPLATE_STEPS,
  TemplateSteps,
  type FlowStep,
} from "./template-steps";

type TemplateFormShellProps = {
  // Index into steps; for the template, form step n is index n.
  step: number;
  // Another flow's steps and eyebrow text (the hotel template by default).
  steps?: FlowStep[];
  eyebrow?: string;
  backLabel?: string;
  title: string;
  description: string;
  children: ReactNode;
};

// Page frame for each step of the hotel template: step rail, heading, content.
export function TemplateFormShell({
  step,
  steps = TEMPLATE_STEPS,
  eyebrow,
  backLabel,
  title,
  description,
  children,
}: TemplateFormShellProps) {
  const previous = steps[step - 1];

  return (
    <div className="flex flex-1">
      <TemplateSteps current={step} steps={steps} backLabel={backLabel} />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative isolate min-w-0 flex-1 overflow-hidden px-4 py-5 outline-none sm:px-6 lg:px-8 xl:px-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[28rem] rounded-full bg-office-chart-fill/70 blur-3xl"
        />
        {previous?.href ? (
          <Link
            href={previous.href}
            className="focus-ring mb-4 inline-flex items-center gap-1 rounded-md text-sm font-medium text-office-primary lg:hidden"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {backLabel ?? `Back to ${previous.label.toLowerCase()}`}
          </Link>
        ) : null}
        <p className="text-xs font-semibold tracking-[0.14em] text-office-primary uppercase">
          {eyebrow ??
            `Our hotel template · ${step > FORM_STEP_COUNT ? "Review" : `Step ${step} of ${FORM_STEP_COUNT}`}`}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-office-muted sm:text-base">
          {description}
        </p>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
