import { Suspense } from "react";
import { AuthFormSkeleton, AuthLayout, ResetPasswordPanel } from "@/features/guest-auth";

export const metadata = { title: "Choose a new password" };

// Target of the emailed link: /reset-password?token=…
export default function Page({ searchParams }: PageProps<"/central/reset-password">) {
  return (
    <AuthLayout hero="sign-in" title="Choose a new password">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordPanel searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
