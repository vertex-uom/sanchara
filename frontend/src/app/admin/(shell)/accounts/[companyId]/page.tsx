import { AccountsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("accounts");

// Same page as /accounts with one company open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/accounts/[companyId]">) {
  return <AccountsPage searchParams={searchParams} params={params} />;
}
