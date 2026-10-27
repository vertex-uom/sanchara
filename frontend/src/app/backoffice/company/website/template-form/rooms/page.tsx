import { RoomsPricesForm, TemplateFormShell } from "@/features/website-builder";

export const metadata = { title: "Rooms & Prices · Website Builder" };

// Hotel template, step 3: room categories and prices.
export default function Page() {
  return (
    <TemplateFormShell
      step={3}
      title="Rooms & Prices"
      description="Add your room types and what they cost. Guests see these on your Rooms page and when they book."
    >
      <RoomsPricesForm />
    </TemplateFormShell>
  );
}
