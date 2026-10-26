import Link from "next/link";
import { Check, ChevronLeft, Headphones } from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

export type FlowStep = { label: string; href?: string };

// href is set once a step's page exists.
export const TEMPLATE_STEPS: FlowStep[] = [
  { label: "Choose method", href: `${COMPANY_PATHS.website}/templates` },
  { label: "Hotel details", href: FORM_PATH },
  { label: "Brand & colors", href: `${FORM_PATH}/brand` },
  { label: "Rooms & prices", href: `${FORM_PATH}/rooms` },
  { label: "Facilities & photos", href: `${FORM_PATH}/facilities` },
  { label: "Policies & booking", href: `${FORM_PATH}/policies` },
  { label: "Contact & social", href: `${FORM_PATH}/contact` },
  { label: "Review & publish", href: `${FORM_PATH}/review` },
];

// "Step 2 of 6" counts the form steps only, not "Choose method" or "Review".
export const FORM_STEP_COUNT = TEMPLATE_STEPS.length - 2;

type TemplateStepsProps = {
  // Index into steps of the step on screen; earlier steps show as done.
  current: number;
  // The flow's steps; the hotel template flow by default.
  steps?: FlowStep[];
  // Text under "Website Builder"; "Back to {previous step}" by default.
  backLabel?: string;
};

// Left rail of a website builder flow; it replaces the Back Office sidebar.
export function TemplateSteps({
  current,
  steps = TEMPLATE_STEPS,
  backLabel,
}: TemplateStepsProps) {
  const previous = steps[current - 1];

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-office-sidebar px-4 py-5 lg:flex print:hidden">
      {previous?.href ? (
        <Link
          href={previous.href}
          className="focus-ring flex gap-2 rounded-lg text-office-icon"
        >
          <ChevronLeft aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="block font-semibold">Website Builder</span>
            <span className="block text-xs font-medium text-office-primary">
              {backLabel ?? `Back to ${previous.label.toLowerCase()}`}
            </span>
          </span>
        </Link>
      ) : null}
      <nav aria-label="Website builder steps">
        <ol className="flex flex-col">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active && "bg-office-primary text-white",
                    done && "bg-office-tint-teal text-office-primary",
                    !active &&
                      !done &&
                      "border border-office-meter-track bg-card text-office-muted",
                  )}
                >
                  {done ? (
                    <Check
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2.5}
                    />
                  ) : (
                    index + 1
                  )}
                </span>
                {step.label}
                {done ? <span className="sr-only">(done)</span> : null}
              </>
            );
            const rowClass = cn(
              "flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-office-icon",
              active && "bg-office-nav-active font-semibold",
            );
            return (
              <li
                key={step.label}
                aria-current={active ? "step" : undefined}
                className="relative"
              >
                {/* Short line joining a finished step to the next one. */}
                {done ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-[2.15rem] left-[1.32rem] h-2.5 w-px bg-office-primary/60"
                  />
                ) : null}
                {done && step.href ? (
                  <Link
                    href={step.href}
                    className={cn(
                      rowClass,
                      "focus-ring hover:bg-office-nav-active",
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <Link
        href={`${COMPANY_PATHS.website}/assistance`}
        className="focus-ring mt-auto flex items-center gap-3 rounded-xl bg-card p-3 shadow-[0_4px_16px_rgb(15_107_110/0.06)]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-office-chip text-office-icon">
          <Headphones
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.75}
          />
        </span>
        <span>
          <span className="block text-sm font-semibold text-office-icon">
            Need help?
          </span>
          <span className="block text-xs text-office-muted">
            Get assistance from WEMIXT
          </span>
        </span>
      </Link>
    </aside>
  );
}
