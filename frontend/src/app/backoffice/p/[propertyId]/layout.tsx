import { BackofficeLayout } from "@/components/shell/backoffice-layout";

// Every Back Office page depends on the signed-in staff member and their
// company's properties, so none can be instant; this opts the segment out of
// instant-navigation validation in dev.
export const instant = false;

// Back Office shell for property pages.
export default function Layout({ params, children }: LayoutProps<"/backoffice/p/[propertyId]">) {
  return <BackofficeLayout propertyId={params.then((p) => p.propertyId)}>{children}</BackofficeLayout>;
}
