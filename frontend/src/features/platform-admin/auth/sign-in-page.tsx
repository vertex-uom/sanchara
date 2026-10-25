import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { ICON_STROKE } from "../sidebar-modes";
import { AdminSignInForm } from "./sign-in-form";

// Platform Admin sign-in: a single card on the console background. It doesn't
// read the session: in Next 16.4, reading cookies() while a page re-renders
// after a Server Action fails (InvariantError), and the redirect-if-signed-in
// convenience isn't worth that.
export function AdminSignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-admin-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo className="mb-6 justify-center [&>span]:text-admin-heading" />
        <section aria-labelledby="admin-sign-in-title" className="rounded-[14px] border border-admin-border bg-admin-card p-6 shadow-sm">
          <h1 id="admin-sign-in-title" className="text-lg font-semibold text-admin-heading">
            Platform Admin sign in
          </h1>
          <p className="mt-1 mb-5 text-[12.5px] text-admin-muted-text">For the Sanchara platform team only.</p>
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
