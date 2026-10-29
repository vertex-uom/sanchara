import { BackofficeLayout } from "@/components/shell/backoffice-layout";

// Every Back Office page depends on the signed-in staff member and their
// company's properties, so none can be instant; this opts the segment out of
// instant-navigation validation in dev.
export const instant = false;

// Back Office shell for company-wide pages.
export default function Layout({ children }: LayoutProps<"/backoffice/company">) {
  return <BackofficeLayout>{children}</BackofficeLayout>;
}
