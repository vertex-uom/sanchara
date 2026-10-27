import { Suspense } from "react";
import { AuthFormSkeleton, AuthLayout, SignUpPanel } from "@/features/guest-auth";

export const metadata = { title: "Create account" };

export default function Page({ searchParams }: PageProps<"/central/sign-up">) {
  return (
    <AuthLayout hero="sign-up" title="Create account">
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignUpPanel searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
