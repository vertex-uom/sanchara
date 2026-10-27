import {
  PoliciesBookingForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Policies & Booking · Website Builder" };

// Hotel template, step 5: check-in times, booking mode, payments and rules.
export default function Page() {
  return (
    <TemplateFormShell
      step={5}
      title="Policies & Booking"
      description="Set your check-in times, how guests book and pay, and your house rules."
    >
      <PoliciesBookingForm />
    </TemplateFormShell>
  );
}
