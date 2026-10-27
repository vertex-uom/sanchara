import { TemplateFormShell, TemplateReview } from "@/features/website-builder";

export const metadata = { title: "Review Your Details · Website Builder" };

// Hotel template, last step: review every answer before publishing.
export default function Page() {
  return (
    <TemplateFormShell
      step={7}
      title="Review Your Details"
      description="Check every answer before we build your website. Click Edit to change anything."
    >
      <TemplateReview />
    </TemplateFormShell>
  );
}
