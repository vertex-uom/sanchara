import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("analytics");

export default function Page() {
  return <AdminPage navKey="analytics" />;
}
