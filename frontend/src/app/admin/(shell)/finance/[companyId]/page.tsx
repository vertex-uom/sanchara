import { FinancePage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("finance");

// Same page as /finance with one company's subscription open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/finance/[companyId]">) {
  return <FinancePage searchParams={searchParams} params={params} />;
}
