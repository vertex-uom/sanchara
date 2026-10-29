import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { signInPath, type StaffPortal } from "@/lib/auth/staff";
import { PORTAL_COPY } from "../portal-copy";
import { checkInvite } from "../server/invites";
import { AcceptInviteForm } from "./accept-invite-form";
import { FormMessage, linkClass } from "./controls";
import { ForgotPasswordForm, ResetPasswordForm } from "./password-forms";
import { SignInForm, type Notice } from "./sign-in-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// These pages don't read the session: in Next 16.4, reading cookies() while a
// page re-renders after a Server Action fails (InvariantError), so a signed-in
// visitor simply sees the form.
function AuthCard({ portal, title, description, footer, children }: { portal: StaffPortal; title: string; description?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-office-sidebar px-4 py-10 outline-none">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <span className="rounded-md bg-office-pill px-2.5 py-1 text-xs font-medium text-office-label">{PORTAL_COPY[portal].badge}</span>
        </div>
        <section aria-labelledby="staff-auth-title" className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 id="staff-auth-title" className="text-xl font-semibold text-foreground">
            {title}
          </h1>
          {description ? <p className="mt-1 text-sm text-office-muted">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </section>
        {footer ? <p className="mt-4 text-center text-xs text-office-muted">{footer}</p> : null}
      </div>
    </main>
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="h-11 animate-pulse rounded-md bg-office-nav-active motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function StaffSignInPage({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  const copy = PORTAL_COPY[portal];
  return (
    <AuthCard portal={portal} title={copy.signInTitle} description={copy.signInDescription} footer={copy.noAccount}>
      <Suspense fallback={<FormSkeleton />}>
        <SignInPanel portal={portal} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignInPanel({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  const query = await searchParams;
  const error = first(query.error);
  let notice: Notice | null = null;
  if (first(query.reset) === "1") notice = { text: "Your password was changed. Sign in with your new password.", tone: "info" };
  else if (first(query["signed-out"]) === "1") notice = { text: "You've signed out.", tone: "info" };
  else if (error === "no-account") notice = { text: PORTAL_COPY[portal].googleNoAccount, tone: "error" };
  else if (error === "google") notice = { text: "Google sign-in didn't finish. Please try again.", tone: "error" };
  return <SignInForm portal={portal} notice={notice} />;
}

export function StaffForgotPasswordPage({ portal }: { portal: StaffPortal }) {
  return (
    <AuthCard portal={portal} title="Reset your password" description="Enter your email and we'll send you a link to choose a new password.">
      <ForgotPasswordForm portal={portal} />
    </AuthCard>
  );
}

// Target of the emailed link: …/reset-password?token=…
export function StaffResetPasswordPage({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  return (
    <AuthCard portal={portal} title="Choose a new password">
      <Suspense fallback={<FormSkeleton />}>
        <ResetPasswordPanel portal={portal} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function ResetPasswordPanel({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  return <ResetPasswordForm portal={portal} token={first((await searchParams).token) ?? ""} />;
}

// Target of the emailed invite: …/accept-invite?token=…
export function StaffAcceptInvitePage({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  return (
    <AuthCard portal={portal} title="Set up your account">
      <Suspense fallback={<FormSkeleton />}>
        <AcceptInvitePanel portal={portal} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function AcceptInvitePanel({ portal, searchParams }: { portal: StaffPortal; searchParams: SearchParams }) {
  const token = first((await searchParams).token) ?? "";
  const invite = await checkInvite(token, portal);
  if (!invite) {
    return (
      <div className="space-y-5">
        <FormMessage message={`This invite link is invalid or has expired. Ask ${PORTAL_COPY[portal].newInviteFrom} to send a new one.`} />
        <p className="text-center text-sm text-office-muted">
          Already set up?{" "}
          <Link href={signInPath(portal)} className={linkClass}>
            Sign in
          </Link>
        </p>
      </div>
    );
  }
  return <AcceptInviteForm portal={portal} token={token} invite={invite} />;
}
