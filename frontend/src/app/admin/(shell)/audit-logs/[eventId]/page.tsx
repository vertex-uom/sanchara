import { AuditLogsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("audit-logs");

// Same page as /audit-logs with one event open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/audit-logs/[eventId]">) {
  return <AuditLogsPage searchParams={searchParams} params={params} />;
}
