import { AnnouncementsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("announcements");

export default function Page({ searchParams }: PageProps<"/admin/announcements">) {
  return <AnnouncementsPage searchParams={searchParams} />;
}
