"use client";

import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { adminButtonClass } from "../components/ui";
import { startAdminGoogleSignIn } from "./actions";

// Google's "G" mark, as Google's sign-in branding asks for.
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px] shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={adminButtonClass("secondary", "w-full py-2.5 text-[13px]")}>
      {pending ? <Loader2 aria-hidden="true" className="size-[18px] shrink-0 animate-spin" /> : <GoogleMark />}
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

// Existing admins only: Google never creates an admin account.
export function AdminGoogleSignIn() {
  return (
    <form action={startAdminGoogleSignIn}>
      <GoogleButton />
    </form>
  );
}

const GOOGLE_ERRORS: Record<string, string> = {
  "no-account": "No active admin account uses this Google account. Sign in with the Google account of your admin email, or use your password.",
  google: "Google sign-in didn't complete. Please try again.",
};

// The callback sends failures back here as ?error=…
export function GoogleSignInError() {
  const message = GOOGLE_ERRORS[useSearchParams().get("error") ?? ""];
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12.5px] text-admin-danger">
      {message}
    </p>
  );
}
