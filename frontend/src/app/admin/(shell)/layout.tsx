import { AdminShell } from "@/features/platform-admin";
import { requireAdmin } from "@/lib/auth/admin";

// Every tab of the Platform Admin console renders inside the shell. Sign-in
// pages live outside this group and never get the sidebar.
export default async function AdminShellLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin(); // TEMPORARY stub; see lib/auth/admin.ts
  return <AdminShell user={user}>{children}</AdminShell>;
}
