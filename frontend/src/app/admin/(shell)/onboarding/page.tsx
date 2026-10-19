import { AdminPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("onboarding");

export default function Page() {
  return <AdminPage navKey="onboarding" />;
}
