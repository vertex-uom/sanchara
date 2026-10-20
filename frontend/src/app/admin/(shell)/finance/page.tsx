import { FinancePage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("finance");

export default function Page({ searchParams }: PageProps<"/admin/finance">) {
  return <FinancePage searchParams={searchParams} />;
}
