import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("help");

export default function Page() {
  return <AdminPage navKey="help" />;
}
