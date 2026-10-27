import { AccountsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("accounts");

// The Accounts page on its Website requests tab with one request open.
export default function Page({ params, searchParams }: PageProps<"/admin/accounts/website-requests/[requestId]">) {
  return <AccountsPage searchParams={searchParams} params={params} />;
}
