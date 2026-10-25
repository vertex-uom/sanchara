import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { ICON_STROKE } from "../sidebar-modes";
import { AdminGoogleSignIn, GoogleSignInError } from "./google-sign-in";
import { AdminSignInForm } from "./sign-in-form";

// Platform Admin sign-in: Google (existing admins) or email + password, in a
// single card on the console background. It doesn't
// read the session: in Next 16.4, reading cookies() while a page re-renders
// after a Server Action fails (InvariantError), and the redirect-if-signed-in
// convenience isn't worth that.
export function AdminSignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-admin-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <Logo className="mb-7 justify-center [&>span]:text-admin-heading" />
        <section aria-labelledby="admin-sign-in-title" className="rounded-[16px] border border-admin-border bg-admin-card p-6 shadow-sm sm:p-8">
          <h1 id="admin-sign-in-title" className="text-xl font-semibold text-admin-heading">
            Platform Admin sign in
          </h1>
          <p className="mt-1 mb-6 text-[13px] text-admin-muted-text">For the Sanchara platform team only.</p>
          <Suspense fallback={null}>
            <GoogleSignInError />
          </Suspense>
          <AdminGoogleSignIn />
          <div className="my-5 flex items-center gap-3 text-[11.5px] text-admin-muted-text">
            <span aria-hidden="true" className="h-px flex-1 bg-admin-border" />
            or sign in with email
            <span aria-hidden="true" className="h-px flex-1 bg-admin-border" />
          </div>
          <AdminSignInForm />
        </section>
        <p className="mt-4 flex items-start gap-2 text-[11.5px] text-admin-muted-text">
          <ShieldCheck aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0" />
          Sessions end after 30 minutes without activity. Two-step verification is coming.
        </p>
      </div>
    </main>
  );
}
