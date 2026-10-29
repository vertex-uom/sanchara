"use client";

import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { GoogleMark } from "@/components/ui/google-mark";
import { adminButtonClass } from "../components/ui";
import { startAdminGoogleSignIn } from "./actions";

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
