import { OnboardingPage, adminPageMetadata } from "@/features/platform-admin";

export const metadata = adminPageMetadata("onboarding");

// Same page as /onboarding with one application open in the detail panel.
export default function Page({ params, searchParams }: PageProps<"/admin/onboarding/[applicationId]">) {
  return <OnboardingPage searchParams={searchParams} params={params} />;
}
