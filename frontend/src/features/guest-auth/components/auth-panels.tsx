import { redirect } from "next/navigation";
import { getCurrentGuest } from "@/lib/auth/guest";
import { safeReturnTo } from "@/lib/auth/return-to";
import { ForgotPasswordForm, ResetPasswordForm } from "./password-reset-forms";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Signed-in visitors don't need these screens: send them on (checked via /me).
async function redirectIfSignedIn(returnTo: string | null) {
  if (await getCurrentGuest()) redirect(returnTo ?? "/");
}

// These read the request (cookie, query), so pages render them inside <Suspense>.
export async function SignInPanel({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const returnTo = safeReturnTo(first(query.returnTo));
  await redirectIfSignedIn(returnTo);

  const notice =
    first(query.reset) === "1"
      ? { text: "Your password was changed. Sign in with your new password.", tone: "info" as const }
      : first(query.error) === "google"
        ? { text: "Google sign-in didn't finish. Please try again.", tone: "error" as const }
        : null;
  return <SignInForm returnTo={returnTo} notice={notice} />;
}

export async function SignUpPanel({ searchParams }: { searchParams: SearchParams }) {
  const returnTo = safeReturnTo(first((await searchParams).returnTo));
  await redirectIfSignedIn(returnTo);
  return <SignUpForm returnTo={returnTo} />;
}

export async function ForgotPasswordPanel() {
  await redirectIfSignedIn(null);
  return <ForgotPasswordForm />;
}

export async function ResetPasswordPanel({ searchParams }: { searchParams: SearchParams }) {
  return <ResetPasswordForm token={first((await searchParams).token) ?? ""} />;
}
