import { Suspense } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/shell/logo";
import wemixtLogo from "../../../../public/brand/wemixt_logo.png";
import { ICON_STROKE } from "../sidebar-modes";
import { AdminGoogleSignIn, GoogleSignInError } from "./google-sign-in";
import { AdminSignInForm } from "./sign-in-form";

// Platform Admin sign-in: Google (existing admins) or email + password, in a
// single card on the console background. Co-branded: Sanchara is the product,
// Wemixt runs the platform. Sanchara's teal and Wemixt's red appear only as
// soft accents (background glow, card edge) so the form stays the focus.
// It doesn't read the session: in Next 16.4, reading cookies() while a page
// re-renders after a Server Action fails (InvariantError), and the
// redirect-if-signed-in convenience isn't worth that.
export function AdminSignInPage() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-admin-canvas px-4 py-10">
      <BrandGlow />
      <div className="w-full max-w-md">
        <BrandLockup />
        <section aria-labelledby="admin-sign-in-title" className="relative overflow-hidden rounded-[16px] border border-admin-border bg-admin-card p-6 shadow-[0_12px_40px_-16px_rgb(11_37_69/0.18)] sm:p-8">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-admin-teal to-admin-wemixt" />
          <h1 id="admin-sign-in-title" className="text-xl font-semibold text-admin-heading">
            Platform Admin sign in
          </h1>
          <p className="mt-1 mb-6 text-[13px] text-admin-muted-text">For the Wemixt team that runs Sanchara.</p>
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

// The two marks side by side, split by a hairline, as partner lockups usually
// are; then the product name and who runs it.
function BrandLockup() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="flex items-center gap-4 rounded-2xl border border-admin-border bg-admin-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <LogoMark className="size-11" />
        <span aria-hidden="true" className="h-8 w-px bg-admin-border" />
        <Image src={wemixtLogo} alt="" width={44} height={44} priority className="size-11 rounded-[10px]" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-admin-heading">Sanchara</p>
      <p className="mt-0.5 text-[12.5px] text-admin-muted-text">
        Platform console <span aria-hidden="true">·</span> <span className="font-medium text-admin-body">by Wemixt</span>
      </p>
    </div>
  );
}

// Decorative: a soft teal glow (Sanchara) and a fainter red one (Wemixt) behind
// the card. Static, so there is nothing to reduce for reduced-motion users.
function BrandGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-admin-teal/15 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 size-[26rem] rounded-full bg-admin-wemixt/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(11_37_69/0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
    </div>
  );
}
