import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("accounts");

export default function Page() {
  return <AdminPage navKey="accounts" />;
}
