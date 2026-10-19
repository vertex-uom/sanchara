import { Suspense } from "react";
import { AuthFormSkeleton, AuthLayout, SignInPanel } from "@/features/guest-auth";

export const metadata = { title: "Sign in" };

export default function Page({ searchParams }: PageProps<"/central/sign-in">) {
  return (
    <AuthLayout
      hero="sign-in"
      title={
        <>
          Login <span aria-hidden="true" className="px-1 font-normal text-white/60">/</span>
          <span className="sr-only"> or </span>Sign in
        </>
      }
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignInPanel searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
