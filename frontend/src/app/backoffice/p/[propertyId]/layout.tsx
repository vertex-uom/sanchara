import { BackofficeLayout } from "@/components/shell/backoffice-layout";

// Back Office shell for property pages.
export default function Layout({ params, children }: LayoutProps<"/backoffice/p/[propertyId]">) {
  return <BackofficeLayout propertyId={params.then((p) => p.propertyId)}>{children}</BackofficeLayout>;
}
