import { BackofficeLayout } from "@/components/shell/backoffice-layout";

// Back Office shell for company-wide pages.
export default function Layout({ children }: LayoutProps<"/backoffice/company">) {
  return <BackofficeLayout>{children}</BackofficeLayout>;
}
