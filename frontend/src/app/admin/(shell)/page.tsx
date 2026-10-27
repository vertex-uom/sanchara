import { PlatformOverview, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("overview");

export default function Page() {
  return <PlatformOverview />;
}
