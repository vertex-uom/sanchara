import Link from "next/link";
import { Check, ChevronLeft, Headphones } from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";

export const TEMPLATE_STEPS = [
  "Choose method",
  "Hotel details",
  "Brand & colors",
  "Rooms & prices",
  "Facilities & photos",
  "Policies & booking",
  "Contact & social",
  "Review & publish",
] as const;

type TemplateStepsProps = {
  // Index into TEMPLATE_STEPS of the step on screen; earlier steps show as done.
  current: number;
};

// Left rail of the hotel template flow; it replaces the Back Office sidebar.
export function TemplateSteps({ current }: TemplateStepsProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-office-sidebar px-4 py-5 lg:flex print:hidden">
      <Link
        href={`${COMPANY_PATHS.website}/templates`}
        className="focus-ring flex gap-2 rounded-lg text-office-icon"
      >
        <ChevronLeft aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <span>
          <span className="block font-semibold">Website Builder</span>
          <span className="block text-xs font-medium text-office-primary">
            Back to choose method
          </span>
        </span>
      </Link>
      <nav aria-label="Template steps">
        <ol className="flex flex-col gap-1">
          {TEMPLATE_STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li
                key={step}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-office-icon",
                  active && "bg-office-nav-active font-semibold",
                )}
              >
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
                {step}
                {done ? <span className="sr-only">(done)</span> : null}
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
