import { Suspense } from "react";
import Link from "next/link";
import { requireGuest } from "@/lib/auth/guest";

export const metadata = { title: "My account" };

// Traveller Dashboard: profile from /me. Signed-out visitors go to sign-in.
export default function Page() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl p-6 outline-none">
      <h1 className="text-2xl font-semibold">My account</h1>
      <Suspense fallback={<p className="mt-4 text-sm opacity-70">Loading your profile…</p>}>
        <Profile />
      </Suspense>
    </main>
  );
}

async function Profile() {
  const guest = await requireGuest("/account");
  const rows: [string, string][] = [
    ["Name", guest.fullName],
    ["Email", `${guest.email}${guest.emailVerified ? " (verified)" : ""}`],
    ["Mobile", guest.mobile ?? "Not added"],
  ];
  return (
    <>
      <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm">
        <Link href="/account/bookings" className="focus-ring rounded font-medium underline underline-offset-4">
          My bookings
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/" className="focus-ring rounded font-medium underline underline-offset-4">
          Back to home
        </Link>
      </p>
    </>
  );
}
