import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("roles");

export default function Page() {
  return <AdminPage navKey="roles" />;
}
