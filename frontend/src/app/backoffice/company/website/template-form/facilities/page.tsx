import {
  FacilitiesPhotosForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Facilities & Photos · Website Builder" };

// Hotel template, step 4: amenities, gallery, reviews and nearby attractions.
export default function Page() {
  return (
    <TemplateFormShell
      step={4}
      title="Facilities & Photos"
      description="Select your facilities and upload photos. These fill the Amenities, Gallery and Reviews sections."
    >
      <FacilitiesPhotosForm />
    </TemplateFormShell>
  );
}
