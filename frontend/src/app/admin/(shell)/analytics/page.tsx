import { AnalyticsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("analytics");

export default function Page({ searchParams }: PageProps<"/admin/analytics">) {
  return <AnalyticsPage searchParams={searchParams} />;
}
