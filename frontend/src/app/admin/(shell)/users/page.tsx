import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("users");

export default function Page() {
  return <AdminPage navKey="users" />;
}
