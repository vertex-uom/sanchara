import { AccountsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("accounts");

export default function Page({ searchParams }: PageProps<"/admin/accounts">) {
  return <AccountsPage searchParams={searchParams} />;
}
