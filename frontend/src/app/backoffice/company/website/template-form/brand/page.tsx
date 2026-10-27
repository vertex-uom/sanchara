import { BrandColorsForm, TemplateFormShell } from "@/features/website-builder";

export const metadata = { title: "Brand & Colors · Website Builder" };

// Hotel template, step 2: the color palette.
export default function Page() {
  return (
    <TemplateFormShell
      step={2}
      title="Brand & Colors"
      description="Pick the colors and fonts for your website. They are applied to every page of the template."
    >
      <BrandColorsForm />
    </TemplateFormShell>
  );
}
