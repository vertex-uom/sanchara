import { Suspense } from "react";
import { AuthFormSkeleton, AuthLayout, ForgotPasswordPanel } from "@/features/guest-auth";

export const metadata = { title: "Forgot password" };

// No design yet: the sign-in layout with a single email field.
export default function Page() {
  return (
    <AuthLayout hero="sign-in" title="Forgot password">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ForgotPasswordPanel />
      </Suspense>
    </AuthLayout>
  );
}
