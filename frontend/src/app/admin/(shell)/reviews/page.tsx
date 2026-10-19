import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("reviews");

export default function Page() {
  return <AdminPage navKey="reviews" />;
}
