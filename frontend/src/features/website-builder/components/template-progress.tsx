import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORM_STEP_COUNT } from "./template-steps";

type TemplateProgressProps = {
  // 1-based form step ("Step 2 of 6").
  formStep: number;
  note: string;
  // id of the <form> that "Save & continue" submits.
  formId: string;
  backHref: string;
  onSaveDraft: () => void;
  saved: boolean;
};

// Right-hand card on every template step: progress, continue, back, draft.
export function TemplateProgress({
  formStep,
  note,
  formId,
  backHref,
  onSaveDraft,
  saved,
}: TemplateProgressProps) {
  const percent = Math.round((formStep / FORM_STEP_COUNT) * 100);

  return (
    <aside
      aria-label="Your progress"
      className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] xl:sticky xl:top-24 xl:w-80 xl:shrink-0"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-office-icon">Your progress</h2>
        <span className="rounded-full bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
          Sanchara Hotel Template
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-office-icon">
          Step {formStep} of {FORM_STEP_COUNT}
        </span>
        <span className="font-medium text-office-primary">
          {percent}% complete
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Template progress"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2 overflow-hidden rounded-full bg-office-meter-track"
      >
        <div
          className="h-full rounded-full bg-office-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-office-muted">{note}</p>
      <Button
        type="submit"
        form={formId}
        variant="office"
        className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
      >
        Save &amp; continue
        <ArrowRight aria-hidden="true" className="size-[18px]" />
      </Button>
      <Button
        asChild
        variant="outline"
        className="mt-3 h-11 w-full border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
      >
        <Link href={backHref}>Back</Link>
      </Button>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onSaveDraft}
          className="focus-ring rounded font-semibold text-office-primary hover:underline"
        >
          Save as draft
        </button>
        <span role="status" className="text-office-muted">
          {saved ? "All changes saved · just now" : "Unsaved changes"}
        </span>
      </div>
    </aside>
  );
}
