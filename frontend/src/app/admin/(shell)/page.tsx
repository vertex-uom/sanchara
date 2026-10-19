import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("overview");

export default function Page() {
  return <AdminPage navKey="overview" />;
}
