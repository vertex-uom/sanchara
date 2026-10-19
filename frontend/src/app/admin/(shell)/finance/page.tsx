import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("finance");

export default function Page() {
  return <AdminPage navKey="finance" />;
}
