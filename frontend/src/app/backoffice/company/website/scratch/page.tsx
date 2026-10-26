import { getCompanyProperties } from "@/features/properties";
import {
  SCRATCH_STEPS,
  ScratchBasicsForm,
  siteFontVariables,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Set Up Your Website · Website Builder" };

// "Start from scratch", step 2: site basics. The name starts from the
// company's first property.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <div className={`${siteFontVariables} flex flex-1`}>
      <TemplateFormShell
        step={1}
        steps={SCRATCH_STEPS}
        eyebrow="Start from scratch"
        backLabel="Back to decision"
        title="Set Up Your Website"
        description="Add your basic details and brand style. We'll use them across every block you add."
      >
        <ScratchBasicsForm hotelName={property?.name ?? ""} />
      </TemplateFormShell>
    </div>
  );
}
