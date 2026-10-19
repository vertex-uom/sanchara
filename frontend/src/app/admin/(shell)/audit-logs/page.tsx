import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("audit-logs");

export default function Page() {
  return <AdminPage navKey="audit-logs" />;
}
