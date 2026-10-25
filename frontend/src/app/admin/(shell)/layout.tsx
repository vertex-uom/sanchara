import { Suspense } from "react";
import { AdminShell } from "@/features/platform-admin";
import { requireAdmin } from "@/lib/auth/admin";

// Every tab of the Platform Admin console renders inside the shell. Sign-in
// pages live outside this group and never get the sidebar.
// The session is read per request, so the signed-in shell streams in behind
// <Suspense> (Cache Components). This redirect is for the visitor; the API
// checks the admin session on every call (lib/auth/admin.ts adminFetch).
// Every console page depends on the signed-in admin, so none can be instant;
// this opts the segment out of instant-navigation validation in dev.
export const instant = false;

export default function AdminShellLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-admin-canvas" />}>
      <SignedInShell>{children}</SignedInShell>
    </Suspense>
  );
}

async function SignedInShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
