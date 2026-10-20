import { AnnouncementsPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("announcements");

// Same page as /announcements with one announcement open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/announcements/[announcementId]">) {
  return <AnnouncementsPage searchParams={searchParams} params={params} />;
}
