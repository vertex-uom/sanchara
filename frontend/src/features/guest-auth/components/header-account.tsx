import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { DashboardNotifications } from "@/components/notifications/DashboardNotifications";
import { getCurrentGuest } from "@/lib/auth/guest";
import { GuestMenu } from "./guest-menu";

const pillClass =
  "focus-ring inline-flex min-h-11 items-center gap-2 justify-self-end rounded-full bg-white py-1.5 pr-4 pl-1.5 text-sm font-medium text-brand-tropical shadow transition-colors hover:bg-brand-aqua motion-reduce:transition-none";

// Header action for central pages: streams in behind <Suspense> because it
// reads the session cookie; the skeleton keeps the header from shifting.
export function HeaderAccount() {
  return (
    <Suspense fallback={<HeaderAccountSkeleton />}>
      <HeaderAccountContent />
    </Suspense>
  );
}

// Notifications and the account menu when signed in, otherwise the sign-in pill.
async function HeaderAccountContent() {
  const guest = await getCurrentGuest();
  if (guest) {
    return (
      <div className="flex items-center gap-2 justify-self-end">
        <DashboardNotifications variant="traveller" />
        <GuestMenu fullName={guest.fullName} email={guest.email} />
      </div>
    );
  }
  return (
    <Link href="/sign-in" className={pillClass}>
      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-brand-blaze text-white">
        <User className="size-4" />
      </span>
      <span className="hidden sm:inline">Login / Sign in</span>
      <span className="sm:hidden">Sign in</span>
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

function HeaderAccountSkeleton() {
  return (
    <span aria-hidden="true" className="h-11 w-24 justify-self-end rounded-full bg-white/30 sm:w-44" />
  );
}
