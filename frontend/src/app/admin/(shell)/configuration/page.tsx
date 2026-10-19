import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("configuration");

export default function Page() {
  return <AdminPage navKey="configuration" />;
}
