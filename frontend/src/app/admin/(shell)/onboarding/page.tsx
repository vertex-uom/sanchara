import { OnboardingPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("onboarding");

export default function Page({ searchParams }: PageProps<"/admin/onboarding">) {
  return <OnboardingPage searchParams={searchParams} />;
}
