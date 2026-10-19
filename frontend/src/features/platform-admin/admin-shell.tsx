import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/auth/admin";
import { AdminFooterCard } from "./admin-footer-card";
import { AdminHeader } from "./admin-header";
import { AdminSidebarFrame } from "./admin-sidebar-frame";

// Platform Admin console shell: sidebar, top bar and the page's main region.
export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  return (
    <AdminSidebarFrame sidebarFooter={<AdminFooterCard />} topBar={<AdminHeader user={user} />}>
      <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-10 outline-none sm:px-6 md:px-8">
        {children}
      </main>
    </AdminSidebarFrame>
  );
}
