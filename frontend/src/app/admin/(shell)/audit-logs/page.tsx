import { AuditLogsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("audit-logs");

export default function Page({ searchParams }: PageProps<"/admin/audit-logs">) {
  return <AuditLogsPage searchParams={searchParams} />;
}
